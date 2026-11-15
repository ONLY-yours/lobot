import { describe, expect, it } from 'vitest';

import { connectStepLabelKeys } from './stepLabels';

describe('connectStepLabelKeys', () => {
  it('numbers device and agents as steps 1 and 2 of the standalone flow', () => {
    expect(connectStepLabelKeys(false)).toEqual({
      agents: 'connectAgent.create.stepAgents',
      device: 'connectAgent.create.stepDevice',
    });
  });

  // Regression: inside Create Agent the agent step read "Step 2 of 3" though the form is step 1.
  it('shifts them to steps 2 and 3 inside Create Agent', () => {
    expect(connectStepLabelKeys(true)).toEqual({
      agents: 'connectAgent.create.stepAgentsPick',
      device: 'connectAgent.create.stepDevicePick',
    });
  });
});
