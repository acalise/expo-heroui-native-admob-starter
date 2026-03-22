// Mock for react-native-worklets — peer dep of heroui-native, not available in Expo Go
const noop = () => {};
const noopWorklet = (fn) => fn;

/**
 * scheduleOnRN schedules a callback on the React Native JS thread.
 * In Expo Go we just call it directly since we don't have the native worklet runner.
 */
function scheduleOnRN(fn) {
  try { fn(); } catch {}
}

function createRunOnJS(fn) {
  return fn;
}

function runOnJS(fn) {
  return fn;
}

function runOnUI(fn) {
  return fn;
}

function makeShareable(value) {
  return value;
}

function useWorkletCallback(fn) {
  return fn;
}

module.exports = {
  scheduleOnRN,
  createRunOnJS,
  runOnJS,
  runOnUI,
  makeShareable,
  useWorkletCallback,
  Worklets: {
    createRunOnJS,
    runOnJS,
    runOnUI,
    makeShareable,
  },
  default: {
    scheduleOnRN,
    createRunOnJS,
    runOnJS,
    runOnUI,
    makeShareable,
  },
};
