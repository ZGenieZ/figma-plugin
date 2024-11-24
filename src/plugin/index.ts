import { isPayloadMessage, requestToUI } from '../ui/lib/figma';
import {
  INVALIDATE_NODE_TYPES,
  NODE_NAME_MAP,
  PLUGIN_ACTION,
  PRODUCT_CARD_ID_MAP_KEY,
} from '../shared/constants';

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

function findChildrenNodesByName(
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
  const foundNodes: SceneNode[] = [];

  const visitedNodes = new Set<BaseNode>(); // 이미 탐색한 노드를 중복 탐색하지 않도록 저장

  function processNode(node: SceneNode) {
    // 이미 탐색한 노드는 건너뛴다
    if (visitedNodes.has(node)) return;
    visitedNodes.add(node);

    // 현재 노드 및 하위 노드 탐색
    foundNodes.push(
      ...findChildrenNodesByName(node as SceneNode & ChildrenMixin, targetName),
    );

    // 상위 계층으로 올라가면서 부모와 형제 노드 탐색
    let currentNode = node.parent;

    while (currentNode) {
      // 문서 최상위 노드, 개별 페이지 노드는 유효한 노드에 포함되지 않음
      if (INVALIDATE_NODE_TYPES.includes(currentNode.type)) {
        break;
      }

      // 현재 노드가 탐색되지 않았을 경우 Set에 추가 후 현재 노드 및 하위 노드 검색
      if (!visitedNodes.has(currentNode)) {
        visitedNodes.add(currentNode);
        foundNodes.push(
          ...findChildrenNodesByName(
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

function findParentNodeByName(
  node: SceneNode & ChildrenMixin,
  targetName: string,
) {
  const currentNode = node.parent;

  if (!currentNode || INVALIDATE_NODE_TYPES.includes(currentNode.type)) {
    return null;
  }

  if (currentNode.name === targetName) {
    return currentNode;
  }

  return findParentNodeByName(
    currentNode as SceneNode & ChildrenMixin,
    targetName,
  );
}

function findChildrenNodeByName(
  node: SceneNode & ChildrenMixin,
  targetName: string,
): SceneNode | null {
  if (node.name === targetName) {
    return node;
  }

  let foundNode: SceneNode | null = null;

  if ('children' in node && node.children.length > 0) {
    node.children.some((child) => {
      foundNode = findChildrenNodeByName(
        child as SceneNode & ChildrenMixin,
        targetName,
      );

      return foundNode !== null; // 조건에 맞는 값을 찾으면 반복 종료
    });

    return foundNode;
  }

  return null;
}

function serializeMap(map: Map<string, Map<string, string>>): string {
  // Map<string, Map<string, string>>을 직렬화
  const objectRepresentation = Object.fromEntries(
    Array.from(map.entries()).map(([key, innerMap]) => [
      key,
      Object.fromEntries(innerMap),
    ]),
  );

  return JSON.stringify(objectRepresentation);
}

function deserializeMap(
  serializedString: string,
): Map<string, Map<string, string>> {
  // JSON 문자열을 객체로 파싱
  const parsedObject = JSON.parse(serializedString);

  // 객체를 Map<string, Map<string, string>> 형태로 변환
  return new Map(
    Object.entries(parsedObject).map(([key, innerObject]) => [
      key,
      new Map(Object.entries(innerObject as Record<string, string>)),
    ]),
  );
}

function setProductCardNodeIdMap(targetNodes: ReadonlyArray<SceneNode>) {
  const rootNodeIdMap = new Map<string, Map<string, string>>();

  targetNodes.forEach((rootNode: SceneNode & ChildrenMixin) => {
    // 선택한 노드가 prdCard 노드이면 자식인 prdImage, prdName 노드를 탐색해서 id 값과 매칭
    if (rootNode.name === NODE_NAME_MAP.PRODUCT_CARD_NODE) {
      const childNodeIdMap = new Map<string, string>();

      const prdImageNode = findChildrenNodeByName(
        rootNode,
        NODE_NAME_MAP.PRODUCT_IMAGE_NODE,
      );

      const prdNameNode = findChildrenNodeByName(
        rootNode,
        NODE_NAME_MAP.PRODUCT_NAME_NODE,
      );

      childNodeIdMap.set(NODE_NAME_MAP.PRODUCT_IMAGE_NODE, prdImageNode.id);
      childNodeIdMap.set(NODE_NAME_MAP.PRODUCT_NAME_NODE, prdNameNode.id);
      rootNodeIdMap.set(rootNode.id, childNodeIdMap);
      return;
    }

    // 선택한 노드가 prdImage 노드거나 prdName 노드일 경우 부모인 prdCard를 탐색해서 id 값과 매칭
    if (
      rootNode.name === NODE_NAME_MAP.PRODUCT_IMAGE_NODE ||
      rootNode.name === NODE_NAME_MAP.PRODUCT_NAME_NODE
    ) {
      const prdCardNode = findParentNodeByName(
        rootNode,
        NODE_NAME_MAP.PRODUCT_CARD_NODE,
      );

      if (prdCardNode) {
        const childNodeIdMap = new Map<string, string>();

        childNodeIdMap.set(rootNode.name, rootNode.id);
        rootNodeIdMap.set(prdCardNode.id, childNodeIdMap);
      }

      return;
    }

    // 선택한 노드가 prdCard 내부에 존재하는지 확인
    const prdCardNode = findParentNodeByName(
      rootNode,
      NODE_NAME_MAP.PRODUCT_CARD_NODE,
    );

    if (!prdCardNode) {
      return;
    }

    // 선택한 노드가 prdCard 내부에 존재할 경우 자식 탐색으로 prdImage, prdName 노드 탐색
    const prdImageNode = findChildrenNodeByName(
      rootNode,
      NODE_NAME_MAP.PRODUCT_IMAGE_NODE,
    );

    const prdNameNode = findChildrenNodeByName(
      rootNode,
      NODE_NAME_MAP.PRODUCT_NAME_NODE,
    );

    if (!prdImageNode && !prdNameNode) {
      return;
    }

    const childNodeIdMap = new Map<string, string>();

    if (prdImageNode) {
      childNodeIdMap.set(NODE_NAME_MAP.PRODUCT_IMAGE_NODE, prdImageNode.id);
    }

    if (prdNameNode) {
      childNodeIdMap.set(NODE_NAME_MAP.PRODUCT_NAME_NODE, prdNameNode.id);
    }

    // 이미 동일한 prdCard 노드 id key로 값이 존재하고 있으면 병합 처리
    if (rootNodeIdMap.get(prdCardNode.id)) {
      const oldValue = rootNodeIdMap.get(prdCardNode.id);
      const newValue = new Map([
        ...Array.from(oldValue),
        ...Array.from(childNodeIdMap),
      ]);

      rootNodeIdMap.set(prdCardNode.id, newValue);
    } else {
      rootNodeIdMap.set(prdCardNode.id, childNodeIdMap);
    }
  });

  return rootNodeIdMap.size === 0 ? null : rootNodeIdMap;
}

function validateSelectedNodes(targetNodes: ReadonlyArray<SceneNode>) {
  if (targetNodes.length === 0) {
    figma.notify('상품 정보를 삽입하고 싶은 프레임을 선택해주세요.', {
      error: true,
    });
    return {
      productCardNodeIdMap: null,
      success: false,
    };
  }

  // prdCard 이름을 가진 노드들을 탐색
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
      productCardNodeIdMap: null,
      success: false,
    };
  }

  if (productCardNodes.length > 100) {
    figma.notify('프레임을 100개 이하로 선택해주세요.', { error: true });
    return {
      productCardNodeIdMap: null,
      success: false,
    };
  }

  const productCardNodeIdMap = setProductCardNodeIdMap(targetNodes);

  return {
    productCardNodeIdMap,
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
      const { randomProductList } = data as {
        randomProductList: { name: string; imageUrl: string }[];
      };

      const productCardIdMap = deserializeMap(
        await figma.clientStorage.getAsync(PRODUCT_CARD_ID_MAP_KEY),
      );

      Array.from(productCardIdMap)
        .map((val) => val[1])
        .forEach((map, index) => {
          const productImageNode = map.get(NODE_NAME_MAP.PRODUCT_IMAGE_NODE);
          const productNameNode = map.get(NODE_NAME_MAP.PRODUCT_NAME_NODE);

          // 이미지 노드이고, 상품 이미지 데이터가 존재하면 이미지 삽입
          if (productImageNode && randomProductList[index]?.imageUrl) {
            addImageToNode(
              figma.getNodeById(productImageNode) as FrameNode | RectangleNode,
              randomProductList[index].imageUrl,
            );
          }

          // 텍스트 노드이고, 상품명 데이터가 존재하면 상품명 지정
          if (productNameNode && randomProductList[index]?.name) {
            addTextToNode(
              figma.getNodeById(productNameNode) as TextNode,
              randomProductList[index].name,
            );
          }
        });
    }
  } else {
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
};
