import { PluginMessage } from '../../shared/types';

const requestToPlugin = <T>(pluginMessage: PluginMessage<T>) => {
  window.parent.postMessage(
    {
      pluginMessage,
    },
    '*',
  );
};

const requestToUI = <T>(pluginMessage: PluginMessage<T>) => {
  figma.ui.postMessage(pluginMessage);
};

const isPayloadMessage = (
  payload: unknown,
): payload is PluginMessage<unknown> =>
  typeof payload === 'object' &&
  Object.prototype.hasOwnProperty.call(payload, 'type') &&
  Object.prototype.hasOwnProperty.call(payload, 'data');

export { requestToPlugin, requestToUI, isPayloadMessage };
