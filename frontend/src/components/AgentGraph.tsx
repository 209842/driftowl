import React, { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'
import { AgentNode, SynthesisData } from '../types'

interface GraphNode {
  id: string
  name: string
  role: string
  color: string
  nodeType: 'expert' | 'contrarian' | 'synthesis' | 'arbitration'
  references: string[]
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number | null
  fy?: number | null
}

interface Props {
  agents: AgentNode[]
  contrarians: AgentNode[]
  synthesis: SynthesisData | null
  arbitration: { verdict: string; mechanism_name: string } | null
  onAgentSelect?: (id: string | null) => void
  selectedAgentId?: string | null
}

function toGraphNode(a: AgentNode, type: 'expert' | 'contrarian'): GraphNode {
  return { ...a, nodeType: type }
}

export default function AgentGraph({ agents, contrarians, synthesis, arbitration, onAgentSelect, selectedAgentId }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const simRef = useRef<d3.Simulation<GraphNode, undefined> | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    // Initialize simulation once
    if (!simRef.current) {
      simRef.current = d3.forceSimulation<GraphNode>()
        .force('charge', d3.forceManyBody().strength(-220))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide((d: GraphNode) =>
          d.nodeType === 'synthesis' ? 56 : d.nodeType === 'arbitration' ? 52 : 42
        ))
        .force('link', d3.forceLink<GraphNode, d3.SimulationLinkDatum<GraphNode>>()
          .id(d => d.id)
          .distance(130)
          .strength(0.25)
        )
      svg.append('g').attr('class', 'links')
      svg.append('g').attr('class', 'nodes')
    }

    const sim = simRef.current

    // Build all nodes
    const allNodes: GraphNode[] = [
      ...agents.map(a => toGraphNode(a, 'expert')),
      ...contrarians.map(a => toGraphNode(a, 'contrarian')),
    ]
    if (synthesis) allNodes.push({
      id: '__synthesis__', name: 'Synthesis', role: '', color: '#FFB800',
      nodeType: 'synthesis', references: []
    })
    if (arbitration) allNodes.push({
      id: '__arbitration__', name: 'Arbitration', role: '', color: '#6366F1',
      nodeType: 'arbitration', references: []
    })

    // Preserve existing positions
    const prevById = new Map<string, GraphNode>()
    sim.nodes().forEach(n => prevById.set(n.id, n))
    allNodes.forEach(n => {
      const prev = prevById.get(n.id)
      if (prev) { n.x = prev.x; n.y = prev.y; n.vx = prev.vx; n.vy = prev.vy }
    })

    // Build links: expert refs + experts→synthesis + contrarians→synthesis + synthesis→arbitration
    const links: Array<{ source: string; target: string }> = []
    const nodeIds = new Set(allNodes.map(n => n.id))
    agents.forEach(a => {
      a.references.forEach(refId => {
        if (nodeIds.has(refId)) links.push({ source: refId, target: a.id })
      })
    })
    if (synthesis) {
      agents.forEach(a => links.push({ source: a.id, target: '__synthesis__' }))
    }
    if (synthesis && contrarians.length > 0) {
      contrarians.forEach(c => links.push({ source: '__synthesis__', target: c.id }))
    }
    if (arbitration && synthesis) {
      links.push({ source: '__synthesis__', target: '__arbitration__' })
    }

    // Update links DOM
    const linkSel = svg.select('.links')
      .selectAll<SVGLineElement, { source: string; target: string }>('line')
      .data(links, d => `${(d.source as any).id ?? d.source}-${(d.target as any).id ?? d.target}`)
    linkSel.enter().append('line')
      .attr('stroke', 'rgba(0,0,0,0.07)')
      .attr('stroke-width', 1)
    linkSel.exit().remove()

    // Update nodes DOM
    const nodeSel = svg.select('.nodes')
      .selectAll<SVGGElement, GraphNode>('g.gnode')
      .data(allNodes, d => d.id)

    const enter = nodeSel.enter()
      .append('g')
      .attr('class', 'gnode')
      .style('cursor', d => d.nodeType === 'expert' ? 'pointer' : 'default')
      .on('mouseenter', (_e, d) => { if (d.nodeType === 'expert') setHoveredId(d.id) })
      .on('mouseleave', (_e, d) => { if (d.nodeType === 'expert') setHoveredId(null) })
      .on('click', (_e, d) => { if (d.nodeType === 'expert') onAgentSelect?.(d.id) })
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active) sim.alphaTarget(0.3).restart()
          d.fx = d.x ?? null; d.fy = d.y ?? null
        })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
        .on('end', (event, d) => {
          if (!event.active) sim.alphaTarget(0)
          d.fx = null; d.fy = null
        })
      )

    // Expert nodes
    const experts = enter.filter(d => d.nodeType === 'expert')
    experts.append('circle')
      .attr('r', 0)
      .attr('fill', 'rgba(255,255,255,0.85)')
      .attr('stroke', 'rgba(0,0,0,0.12)')
      .attr('stroke-width', 1)
      .attr('class', 'outer-circle')
      .transition().duration(400).attr('r', 28)
    experts.append('circle')
      .attr('r', 6).attr('fill', d => d.color).attr('fill-opacity', 0.6)
    experts.append('text')
      .text(d => d.name.split(' ').pop() ?? d.name)
      .attr('text-anchor', 'middle').attr('dy', 44)
      .attr('font-size', 10).attr('font-family', '-apple-system, system-ui')
      .attr('fill', '#0A0A0F').attr('opacity', 0)
      .transition().delay(200).duration(300).attr('opacity', 1)

    // Contrarian nodes
    const contrs = enter.filter(d => d.nodeType === 'contrarian')
    contrs.append('circle')
      .attr('r', 0)
      .attr('fill', 'rgba(255,247,237,0.9)')
      .attr('stroke', d => d.color)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,2')
      .transition().duration(400).attr('r', 22)
    contrs.append('circle')
      .attr('r', 5).attr('fill', d => d.color).attr('fill-opacity', 0.7)
    contrs.append('text')
      .text(d => d.name.split(' ').pop() ?? d.name)
      .attr('text-anchor', 'middle').attr('dy', 36)
      .attr('font-size', 9).attr('font-family', '-apple-system, system-ui')
      .attr('fill', d => d.color).attr('opacity', 0)
      .transition().delay(200).duration(300).attr('opacity', 1)

    // Synthesis node
    const synth = enter.filter(d => d.nodeType === 'synthesis')
    synth.append('circle')
      .attr('r', 0)
      .attr('fill', 'rgba(255,200,50,0.15)')
      .attr('stroke', 'rgba(255,180,0,0.5)')
      .attr('stroke-width', 2)
      .transition().duration(600).attr('r', 40)
    synth.append('text').text('⚡')
      .attr('text-anchor', 'middle').attr('dy', 7).attr('font-size', 22)
    synth.append('text').text('Synthesis')
      .attr('text-anchor', 'middle').attr('dy', 58)
      .attr('font-size', 10).attr('font-weight', '600')
      .attr('font-family', '-apple-system, system-ui').attr('fill', '#0A0A0F')

    // Arbitration node
    const arb = enter.filter(d => d.nodeType === 'arbitration')
    const arbColor = arbitration?.verdict === 'STRENGTHENED'
      ? 'rgba(29,185,84,0.18)' : arbitration?.verdict === 'REVISED'
      ? 'rgba(245,158,11,0.18)' : 'rgba(239,68,68,0.18)'
    arb.append('circle')
      .attr('r', 0)
      .attr('fill', arbColor)
      .attr('stroke', 'rgba(0,0,0,0.15)')
      .attr('stroke-width', 1.5)
      .transition().duration(600).attr('r', 36)
    arb.append('text').text('⚖️')
      .attr('text-anchor', 'middle').attr('dy', 7).attr('font-size', 18)
    arb.append('text').text('Arbitration')
      .attr('text-anchor', 'middle').attr('dy', 52)
      .attr('font-size', 10).attr('font-weight', '600')
      .attr('font-family', '-apple-system, system-ui').attr('fill', '#0A0A0F')

    nodeSel.exit().remove()

    // Run simulation
    sim.nodes(allNodes)
    const linkForce = sim.force<d3.ForceLink<GraphNode, d3.SimulationLinkDatum<GraphNode>>>('link')
    if (linkForce) linkForce.links(links as d3.SimulationLinkDatum<GraphNode>[])
    sim.alpha(0.4).restart()

    sim.on('tick', () => {
      svg.select('.links').selectAll<SVGLineElement, d3.SimulationLinkDatum<GraphNode>>('line')
        .attr('x1', d => (d.source as GraphNode).x ?? 0)
        .attr('y1', d => (d.source as GraphNode).y ?? 0)
        .attr('x2', d => (d.target as GraphNode).x ?? 0)
        .attr('y2', d => (d.target as GraphNode).y ?? 0)

      svg.select('.nodes').selectAll<SVGGElement, GraphNode>('g.gnode')
        .attr('transform', d => `translate(${d.x ?? width / 2},${d.y ?? height / 2})`)
    })
  }, [agents, contrarians, synthesis, arbitration])

  // Highlight on hover (visual only, no scroll)
  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.select('.nodes').selectAll<SVGGElement, GraphNode>('g.gnode')
      .filter(d => d.nodeType === 'expert')
      .select('circle.outer-circle')
      .attr('stroke', d => hoveredId === d.id ? d.color : 'rgba(0,0,0,0.12)')
      .attr('stroke-width', d => hoveredId === d.id ? 2.5 : 1)
      .attr('fill', d => hoveredId === d.id ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.85)')
  }, [hoveredId])

  return (
    <svg ref={svgRef} width="100%" height="100%" style={{ display: 'block' }} />
  )
}
