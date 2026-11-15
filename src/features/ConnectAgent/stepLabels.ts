/**
 * The step captions of the connect flow. Standalone it is three steps of its own (device,
 * agents, confirm); inside Create Agent the identity form is step 1, so device and agents
 * are steps 2 and 3.
 */
export const connectStepLabelKeys = (insideCreateAgent: boolean) =>
  insideCreateAgent
    ? ({
        agents: 'connectAgent.create.stepAgentsPick',
        device: 'connectAgent.create.stepDevicePick',
      } as const)
    : ({
        agents: 'connectAgent.create.stepAgents',
        device: 'connectAgent.create.stepDevice',
      } as const);
