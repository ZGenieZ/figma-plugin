import { isPayloadMessage, requestToUI } from '../ui/lib/figma';
import { NODE_NAME_MAP, PLUGIN_ACTION } from '../shared/constants';

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

async function addTextToNode(node: TextNode, text: string) {
  const currentFont = node.fontName;

  if (typeof currentFont === 'symbol') {
    return;
  }

  await figma.loadFontAsync(currentFont);

  // eslint-disable-next-line no-param-reassign
  node.characters = text;
}

function findNodesByName(
  nodeList: ReadonlyArray<SceneNode>,
  targetName: string,
) {
  const foundNodes = [];

  nodeList.forEach((node) => {
    if (node.name === targetName) {
      foundNodes.push(node);
    }

    if ('children' in node) {
      foundNodes.push(...findNodesByName(node.children, targetName));
    }
  });

  return foundNodes;
}

function getSelectedValidNodes(selectedNodes: ReadonlyArray<SceneNode>) {
  const productImageNodes = findNodesByName(
    selectedNodes,
    NODE_NAME_MAP.PRODUCT_IMAGE_NODE,
  );

  const productNameNodes = findNodesByName(
    selectedNodes,
    NODE_NAME_MAP.PRODUCT_NAME_NODE,
  );

  return [...productImageNodes, ...productNameNodes].filter(
    (node) =>
      node !== null &&
      (node.type === 'FRAME' ||
        node.type === 'RECTANGLE' ||
        node.type === 'TEXT'),
  ) as (FrameNode | RectangleNode | TextNode)[];
}

function checkIsNodeSelected(targetNodes: ReadonlyArray<SceneNode>) {
  if (targetNodes.length === 0) {
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
    const { type, data: productList } = payload;

    if (type === PLUGIN_ACTION.RANDOM_KURLY_PRODUCT_IMAGE) {
      const selectedNodes = getSelectedValidNodes(figma.currentPage.selection);
      selectedNodes.forEach((node, index) => {
        // 이미지 노드일 때 상품 이미지 삽입
        if (
          (node.type === 'FRAME' || node.type === 'RECTANGLE') &&
          node.name === NODE_NAME_MAP.PRODUCT_IMAGE_NODE
        ) {
          addImageToNode(node, productList[index].imageUrl);
        }

        // 텍스트 노드일 때 상품명 지정
        if (
          node.type === 'TEXT' &&
          node.name === NODE_NAME_MAP.PRODUCT_NAME_NODE
        ) {
          addTextToNode(node, productList[index].name);
        }
      });
    }
  } else {
    requestToUI({
      type: PLUGIN_ACTION.VALIDATE_NODE_SELECTED,
      data: {
        success: checkIsNodeSelected(figma.currentPage.selection),
      },
    });
  }
};
