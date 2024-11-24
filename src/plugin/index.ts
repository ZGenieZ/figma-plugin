import {
  isPayloadBaseMessage,
  isPayloadDataMessage,
  requestToUI,
  serializeMap,
} from '../shared/lib/figma';
import {
  setProductCard,
  validateSelectedNodes,
} from '../shared/lib/figma/productCard';
import { PLUGIN_ACTION, PRODUCT_CARD_ID_MAP_KEY } from '../shared/constants';

figma.showUI(__html__, {
  width: 500,
  height: 400,
  title: 'Kurly Product Design Plugin (프로토타입)',
});

figma.ui.onmessage = async (payload: unknown) => {
  if (isPayloadBaseMessage(payload)) {
    const { type } = payload;

    if (type === PLUGIN_ACTION.VALIDATE_NODE_SELECTED) {
      const { success, productCardNodeIdMap } = validateSelectedNodes(
        figma.currentPage.selection,
      );

      if (productCardNodeIdMap !== null) {
        await figma.clientStorage.setAsync(
          PRODUCT_CARD_ID_MAP_KEY,
          serializeMap(productCardNodeIdMap),
        );
      }

      requestToUI({
        type: PLUGIN_ACTION.VALIDATE_NODE_SELECTED,
        data: {
          success,
        },
      });
    }
  }

  if (isPayloadDataMessage(payload)) {
    const { type, data } = payload;

    if (type === PLUGIN_ACTION.RANDOM_KURLY_PRODUCT_CARD) {
      const { randomProductList } = data as {
        randomProductList: { name: string; imageUrl: string }[];
      };

      await setProductCard(randomProductList);
    }
  }
};
