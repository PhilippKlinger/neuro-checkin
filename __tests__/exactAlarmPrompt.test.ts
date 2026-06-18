import { shouldPromptExactAlarm } from '../lib/notifications/exactAlarmPrompt';

describe('shouldPromptExactAlarm', () => {
  it('prompts on a real Android device when exact alarms are not yet allowed', () => {
    expect(
      shouldPromptExactAlarm({ platform: 'android', isDevice: true, exactAllowed: false })
    ).toBe(true);
  });

  it('does not prompt once exact alarms are already allowed', () => {
    expect(
      shouldPromptExactAlarm({ platform: 'android', isDevice: true, exactAllowed: true })
    ).toBe(false);
  });

  it('does not prompt on an emulator (notifications do not fire there anyway)', () => {
    expect(
      shouldPromptExactAlarm({ platform: 'android', isDevice: false, exactAllowed: false })
    ).toBe(false);
  });

  it('does not prompt on non-Android platforms (no exact-alarm special access)', () => {
    expect(shouldPromptExactAlarm({ platform: 'ios', isDevice: true, exactAllowed: false })).toBe(
      false
    );
  });
});
