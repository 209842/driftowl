import React, { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { AgentNode, SynthesisData } from '../types'

interface Props {
  agents: AgentNode[]
  synthesis: SynthesisData | null
  onAgentSelect?: (id: string | null) => void
  selectedAgentId?: string | null
}

export default function AgentGraph({ agents, synthesis, onAgentSelect, selectedAgentId }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const simulationRef = useRef<d3.Simulation<AgentNode, undefined> | null>(null)

  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    if (!simulationRef.current) {
      // Initialize simulation once
      simulationRef.current = d3.forceSimulation<AgentNode>()
        .force('charge', d3.forceManyBody().strength(-200))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide(50))
        .force('link', d3.forceLink<AgentNode, d3.SimulationLinkDatum<AgentNode>>()
          .id(d => d.id)
          .distance(120)
          .strength(0.3)
        )

      svg.append('g').attr('class', 'links')
      svg.append('g').attr('class', 'nodes')
    }

    const sim = simulationRef.current

    // Build edges from references
    const links: Array<{ source: string; target: string }> = []
    agents.forEach(agent => {
      agent.references.forEach(refId => {
        if (agents.find(a => a.id === refId)) {
          links.push({ source: refId, target: agent.id })
        }
      })
    })

    // Update links
    const linkSel = svg.select('.links')
      .selectAll<SVGLineElement, { source: string; target: string }>('line')
      .data(links, d => `${d.source}-${d.target}`)

    linkSel.enter().append('line')
      .attr('stroke', 'rgba(0,0,0,0.06)')
      .attr('stroke-width', 1)

    linkSel.exit().remove()

    // Update nodes
    const nodeSel = svg.select('.nodes')
      .selectAll<SVGGElement, AgentNode>('g.node')
      .data(agents, d => d.id)

    const nodeEnter = nodeSel.enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .on('mouseenter', (_event, d) => { onAgentSelect?.(d.id) })
      .on('mouseleave', () => { onAgentSelect?.(null) })
      .on('click', (_event, d) => { onAgentSelect?.(d.id) })
      .call(d3.drag<SVGGElement, AgentNode>()
        .on('start', (event, d) => {
          if (!event.active) sim.alphaTarget(0.3).restart()
          d.fx = d.x ?? null
          d.fy = d.y ?? null
        })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
        .on('end', (event, d) => {
          if (!event.active) sim.alphaTarget(0)
          d.fx = null; d.fy = null
        })
      )

    // Outer circle — monochromatic glass
    nodeEnter.append('circle')
      .attr('r', 0)
      .attr('fill', 'rgba(255,255,255,0.85)')
      .attr('stroke', 'rgba(0,0,0,0.12)')
      .attr('stroke-width', 1)
      .transition().duration(400)
      .attr('r', 28)

    // Inner colored dot — desaturated accent
    nodeEnter.append('circle')
      .attr('r', 6)
      .attr('fill', d => d.color)
      .attr('fill-opacity', 0.6)

    // Label below node
    nodeEnter.append('text')
      .text(d => d.name.split(' ').pop() ?? d.name)
      .attr('text-anchor', 'middle')
      .attr('dy', 44)
      .attr('font-size', 10)
      .attr('font-family', '-apple-system, system-ui')
      .attr('fill', '#0A0A0F')
      .attr('opacity', 0)
      .transition().delay(200).duration(300)
      .attr('opacity', 1)

    // Add synthesis node if present
    if (synthesis) {
      const hasSynthesis = svg.select('.nodes').select('#synthesis-node').size() > 0
      if (!hasSynthesis) {
        const synthGroup = svg.select('.nodes').append('g')
          .attr('class', 'node')
          .attr('id', 'synthesis-node')
          .attr('transform', `translate(${width / 2}, ${height / 2})`)

        synthGroup.append('circle')
          .attr('r', 0)
          .attr('fill', 'rgba(255,200,50,0.15)')
          .attr('stroke', 'rgba(255,180,0,0.4)')
          .attr('stroke-width', 2)
          .transition().duration(600)
          .attr('r', 40)

        synthGroup.append('text')
          .text('⚡')
          .attr('text-anchor', 'middle')
          .attr('dy', 7)
          .attr('font-size', 22)

        synthGroup.append('text')
          .text('Synthesis')
          .attr('text-anchor', 'middle')
          .attr('dy', 58)
          .attr('font-size', 10)
          .attr('font-weight', '600')
          .attr('font-family', '-apple-system, system-ui')
          .attr('fill', '#0A0A0F')
      }
    }

    // Restart simulation with new nodes
    sim.nodes(agents)
    const linkForce = sim.force<d3.ForceLink<AgentNode, d3.SimulationLinkDatum<AgentNode>>>('link')
    if (linkForce) linkForce.links(links as d3.SimulationLinkDatum<AgentNode>[])
    sim.alpha(0.5).restart()

    sim.on('tick', () => {
      svg.select('.links').selectAll<SVGLineElement, d3.SimulationLinkDatum<AgentNode>>('line')
        .attr('x1', d => (d.source as AgentNode).x ?? 0)
        .attr('y1', d => (d.source as AgentNode).y ?? 0)
        .attr('x2', d => (d.target as AgentNode).x ?? 0)
        .attr('y2', d => (d.target as AgentNode).y ?? 0)

      svg.select('.nodes').selectAll<SVGGElement, AgentNode>('g.node')
        .attr('transform', d => `translate(${d.x ?? width / 2},${d.y ?? height / 2})`)
    })
  }, [agents, synthesis])

  // Highlight selected node
  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.select('.nodes').selectAll<SVGGElement, AgentNode>('g.node')
      .select('circle:first-child')
      .attr('stroke', (d: AgentNode) => {
        if (!d) return 'rgba(0,0,0,0.12)'
        return selectedAgentId && d.id === selectedAgentId
          ? d.color
          : 'rgba(0,0,0,0.12)'
      })
      .attr('stroke-width', (d: AgentNode) => {
        if (!d) return 1
        return selectedAgentId && d.id === selectedAgentId ? 2.5 : 1
      })
      .attr('fill', (d: AgentNode) => {
        if (!d) return 'rgba(255,255,255,0.85)'
        return selectedAgentId && d.id === selectedAgentId
          ? 'rgba(255,255,255,0.98)'
          : 'rgba(255,255,255,0.85)'
      })
  }, [selectedAgentId])

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      style={{ display: 'block' }}
    />
  )
}
