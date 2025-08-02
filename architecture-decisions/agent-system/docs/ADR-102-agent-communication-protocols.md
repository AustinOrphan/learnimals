# ADR-102: Agent Communication Protocols

## Status
Proposed

## Context
With 19 specialized agents operating in parallel, structured communication is essential to:
- Prevent information silos
- Ensure consistent understanding
- Enable efficient collaboration
- Avoid duplicate work
- Maintain audit trails

Previous analysis showed accuracy issues partly due to unstructured communication, leading to contradictory findings between agents.

## Decision
We will implement structured Agent Communication Protocols (ACP) with standardized formats and channels:

1. **Message Format Standard**:
   ```json
   {
     "messageId": "unique-identifier",
     "timestamp": "ISO-8601",
     "from": "AgentID",
     "to": ["AgentID", "AgentID"],
     "type": "REQUEST|RESPONSE|NOTIFICATION|ESCALATION",
     "priority": "CRITICAL|HIGH|MEDIUM|LOW",
     "domain": "primary-domain",
     "subject": "brief-description",
     "body": {
       "content": "detailed-message",
       "data": {},
       "references": []
     },
     "requiresResponse": boolean,
     "responseDeadline": "ISO-8601"
   }
   ```

2. **Communication Channels**:
   ```
   Direct: One-to-one agent communication
   Broadcast: One-to-all notifications
   Domain: Within domain group messages
   Emergency: Critical issue escalation
   ```

3. **Protocol Types**:
   - **Request-Response**: Synchronous information exchange
   - **Publish-Subscribe**: Asynchronous notifications
   - **Escalation**: Authority-based escalation
   - **Consensus**: Multi-agent agreement protocols

4. **Communication Rules**:
   - All communications logged and traceable
   - Response timeouts trigger escalation
   - Critical messages require acknowledgment
   - Broadcast limited to relevant agents
   - Data validation before transmission

5. **Interaction Patterns**:
   ```
   Information Request:
   A → B: REQUEST{data needed}
   B → A: RESPONSE{data}
   
   Decision Escalation:
   A → Coordinator: ESCALATION{conflict}
   Coordinator → [A,B]: RESOLUTION{decision}
   
   Status Broadcast:
   A → Domain: NOTIFICATION{status update}
   ```

6. **Quality Standards**:
   - Messages must be clear and actionable
   - Include all necessary context
   - Reference related decisions/data
   - Use domain-specific terminology correctly

## Consequences

### Positive
- **Traceability**: Complete communication history
- **Efficiency**: Reduced communication overhead
- **Clarity**: Standardized formats reduce ambiguity
- **Accountability**: Clear message ownership
- **Debugging**: Easy to trace decision flows

### Negative
- **Overhead**: Structured format adds complexity
- **Rigidity**: May constrain natural communication
- **Learning Curve**: Agents must learn protocols
- **Maintenance**: Protocol updates affect all agents

### Neutral
- **Tooling Required**: Need communication infrastructure
- **Monitoring**: Communication patterns need analysis
- **Evolution**: Protocols will need updates

## Alternatives Considered

1. **Free-Form Communication**
   - Pros: Natural, flexible
   - Cons: Ambiguous, hard to trace
   - Reason for rejection: Led to contradictions previously

2. **Email-Style System**
   - Pros: Familiar, simple
   - Cons: Not real-time, poor for automation
   - Reason for rejection: Need structured data exchange

3. **Shared Database Only**
   - Pros: Central truth, consistent
   - Cons: No active communication, polling required
   - Reason for rejection: Need active coordination

4. **Voice/Video Calls**
   - Pros: Rich communication
   - Cons: Not automatable, no trace
   - Reason for rejection: Agents are automated systems

## Related Decisions
- ADR-100: Multi-Agent System Architecture
- ADR-101: Agent Authority Hierarchy
- ADR-200: Agent Communication Protocol (implementation details)
- ADR-204: Resource Allocation Protocol

## References
- [Message Format Specification](../protocols/message-format.md)
- [Communication Patterns](../protocols/communication-patterns.md)
- [Integration Guidelines](../integration-guide.md)

## Notes
Implementation considerations:
- Message queuing for reliability
- Encryption for sensitive data
- Rate limiting to prevent spam
- Circuit breakers for failing agents

Performance targets:
- Message delivery < 100ms
- Response time < 1 second for simple requests
- Throughput: 10,000 messages/minute
- Zero message loss

The Integration Coordinator (A17) monitors communication health and can intervene if agents are not responding or communicating poorly.

---
*Decision proposed by: System Design Team*  
*Date: 2025-02-01*  
*Review needed from all agents*