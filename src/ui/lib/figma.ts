import { PluginMessage } from '../../shared/types';

const requestToPlugin = <T>(pluginMessage: PluginMessage<T>) => {
  parent.postMessage(
    {
      pluginMessage,
    },
    '*',
  );
};

const isPayloadMessage = (payload: unknown): payload is PluginMessage<any> =>
  typeof payload === 'object' &&
  Object.prototype.hasOwnProperty.call(payload, 'type') &&
  Object.prototype.hasOwnProperty.call(payload, 'data');

export { requestToPlugin, isPayloadMessage };
