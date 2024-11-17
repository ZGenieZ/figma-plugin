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

function findSiblingNodesByName(
  rootNode: SceneNode & ChildrenMixin,
  name: string,
) {
  const foundNodes = [];

  function traverse(node: SceneNode & ChildrenMixin) {
    if (node.name === name) {
      foundNodes.push(node);
    }

    if (!('children' in node) || node.children === []) {
      return;
    }

    node.children.forEach(traverse);
  }

  traverse(rootNode);
  return foundNodes;
}

function findAllNodesByName(
  nodeList: ReadonlyArray<SceneNode>,
  targetName: string,
) {
  // 문서 최상위 노드, 개별 페이지 노드는 공통 노드이므로 유효하지 않은 노드로 지정
  const invalidateParentNodes = ['PAGE', 'DOCUMENT'];
  const foundNodes: SceneNode[] = [];

  const visitedNodes = new Set<BaseNode>(); // 이미 탐색한 노드를 중복 탐색하지 않도록 저장

  function processNode(node: SceneNode) {
    // 이미 탐색한 노드는 건너뛴다
    if (visitedNodes.has(node)) return;
    visitedNodes.add(node);

    // 현재 노드 및 하위 노드 탐색
    foundNodes.push(
      ...findSiblingNodesByName(node as SceneNode & ChildrenMixin, targetName),
    );

    // 상위 계층으로 올라가면서 부모와 형제 노드 탐색
    let currentNode = node.parent;

    while (currentNode) {
      // 문서 최상위 노드, 개별 페이지 노드는 유효한 노드에 포함되지 않음
      if (invalidateParentNodes.includes(currentNode.type)) {
        break;
      }

      // 현재 노드가 탐색되지 않았을 경우 Set에 추가 후 현재 노드 및 하위 노드 검색
      if (!visitedNodes.has(currentNode)) {
        visitedNodes.add(currentNode);
        foundNodes.push(
          ...findSiblingNodesByName(
            currentNode as SceneNode & ChildrenMixin,
            targetName,
          ),
        );
      }

      currentNode = currentNode.parent;
    }
  }

  // 선택된 모든 노드 처리
  nodeList.forEach(processNode);

  return foundNodes;
}

function getFilteredNodes(selectedNodes: ReadonlyArray<SceneNode>) {
  return selectedNodes.map((node) => {
    const targetNode = figma.getNodeById(node.id);

    const productImageNodes = findSiblingNodesByName(
      targetNode as SceneNode & ChildrenMixin,
      NODE_NAME_MAP.PRODUCT_IMAGE_NODE,
    ) as (FrameNode | RectangleNode)[];

    const productNameNodes = findSiblingNodesByName(
      targetNode as SceneNode & ChildrenMixin,
      NODE_NAME_MAP.PRODUCT_NAME_NODE,
    ) as TextNode[];

    return {
      productImageNode:
        productImageNodes.length > 0 ? productImageNodes[0] : null,
      productNameNode: productNameNodes.length > 0 ? productNameNodes[0] : null,
    };
  });
}

function validateSelectedNodes(targetNodes: ReadonlyArray<SceneNode>) {
  if (targetNodes.length === 0) {
    figma.notify('상품 정보를 삽입하고 싶은 프레임을 선택해주세요.', {
      error: true,
    });
    return {
      validateNodes: null,
      success: false,
    };
  }

  const productCardNodes = findAllNodesByName(
    targetNodes,
    NODE_NAME_MAP.PRODUCT_CARD_NODE,
  );

  if (productCardNodes.length === 0) {
    figma.notify(
      '프레임을 찾을 수 없어요. 프레임명이 제대로 설정되어 있는지 확인해 주세요.',
      { error: true },
    );
    return {
      validateNodes: null,
      success: false,
    };
  }

  if (productCardNodes.length > 100) {
    figma.notify('프레임을 100개 이하로 선택해주세요.', { error: true });
    return {
      validateNodes: null,
      success: false,
    };
  }

  return {
    validateNodes: productCardNodes,
    success: true,
  };
}

figma.showUI(__html__, {
  width: 500,
  height: 400,
  title: 'Kurly Product Design Plugin (프로토타입)',
});

figma.ui.onmessage = async (payload: unknown) => {
  if (isPayloadMessage(payload)) {
    const { type, data } = payload;

    if (type === PLUGIN_ACTION.RANDOM_KURLY_PRODUCT_CARD) {
      const { randomProductList, validateNodes } = data as {
        randomProductList: { name: string; imageUrl: string }[];
        validateNodes: SceneNode[];
      };

      const filteredNodes = getFilteredNodes(validateNodes);

      filteredNodes.forEach(({ productImageNode, productNameNode }, index) => {
        // 이미지 노드일 때 상품 이미지 삽입
        if (productImageNode) {
          addImageToNode(productImageNode, randomProductList[index].imageUrl);
        }

        // 텍스트 노드일 때 상품명 지정
        if (productNameNode) {
          addTextToNode(productNameNode, randomProductList[index].name);
        }
      });
    }
  } else {
    requestToUI({
      type: PLUGIN_ACTION.VALIDATE_NODE_SELECTED,
      data: validateSelectedNodes(figma.currentPage.selection),
    });
  }
};
