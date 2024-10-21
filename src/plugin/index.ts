import { isPayloadMessage, requestToUI } from '../ui/lib/figma';
import { PLUGIN_ACTION } from '../shared/constants';

async function addImageToNode(
  node: FrameNode | RectangleNode,
  imageUrl: string,
) {
  try {
    // 이미 선택한 노드에 이미지가 삽입되어 있으면 초기화 작업 진행
    if (
      Array.isArray(node.fills) &&
      node.fills.length > 0 &&
      node.fills.some((fill) => fill.type === 'IMAGE')
    ) {
      // eslint-disable-next-line no-param-reassign
      node.fills = [];
    }

    const image = await figma.createImageAsync(imageUrl);

    const imageFill: ImagePaint = {
      type: 'IMAGE',
      scaleMode: 'FILL',
      imageHash: image.hash,
    };

    // eslint-disable-next-line no-param-reassign
    node.fills = [imageFill];
  } catch (error) {
    figma.notify('이미지를 로드하는데 실패하였습니다.', { error: true });
  }
}

function getSelectedValidNodes() {
  const selectedNodes = figma.currentPage.selection;
  return selectedNodes.filter(
    (node) => node.type === 'FRAME' || node.type === 'RECTANGLE',
  ) as (FrameNode | RectangleNode)[];
}

function checkIsValidNodeSelected() {
  const selectedNodes = getSelectedValidNodes();

  if (selectedNodes.length === 0) {
    figma.notify(
      '레이어가 선택되지 않았습니다. 이미지를 삽입하고 싶은 레이어를 선택해주세요.',
      { error: true },
    );
    return false;
  }

  return true;
}

figma.showUI(__html__, {
  width: 500,
  height: 400,
  title: 'Kurly Product Design Plugin (프로토타입)',
});

figma.ui.onmessage = async (payload: unknown) => {
  if (isPayloadMessage(payload)) {
    const { type, data: imageUrlList } = payload;

    if (type === PLUGIN_ACTION.RANDOM_KURLY_PRODUCT_IMAGE) {
      if (!checkIsValidNodeSelected()) {
        return;
      }

      const selectedNodes = getSelectedValidNodes();
      selectedNodes.forEach((node, index) => {
        addImageToNode(node, imageUrlList[index]);
      });
    }
  } else {
    requestToUI({
      type: PLUGIN_ACTION.VALIDATE_NODE_SELECTED,
      data: {
        success: checkIsValidNodeSelected(),
      },
    });
  }
};
