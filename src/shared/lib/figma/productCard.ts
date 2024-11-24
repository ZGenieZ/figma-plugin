import { NODE_NAME_MAP, PRODUCT_CARD_ID_MAP_KEY } from '../../constants';
import {
  addImageToNode,
  addTextToNode,
  findAllNodesByName,
  findChildrenNodeByName,
  findParentNodeByName,
} from './node';
import { deserializeMap } from './utils';

function setProductCardNodeIdMap(targetNodes: ReadonlyArray<SceneNode>) {
  const rootNodeIdMap = new Map<string, Map<string, string>>();

  targetNodes.forEach((rootNode: SceneNode & ChildrenMixin) => {
    // 선택한 노드가 prdCard 노드이면 자식인 prdImage, prdName 노드를 탐색해서 id 값과 매칭
    if (rootNode.name === NODE_NAME_MAP.PRODUCT_CARD_NODE) {
      const prdImageNode = findChildrenNodeByName(
        rootNode,
        NODE_NAME_MAP.PRODUCT_IMAGE_NODE,
      );

      const prdNameNode = findChildrenNodeByName(
        rootNode,
        NODE_NAME_MAP.PRODUCT_NAME_NODE,
      );

      if (!prdNameNode && !prdNameNode) {
        return;
      }

      const childNodeIdMap = new Map<string, string>();

      if (prdImageNode) {
        childNodeIdMap.set(NODE_NAME_MAP.PRODUCT_IMAGE_NODE, prdImageNode.id);
      }

      if (prdNameNode) {
        childNodeIdMap.set(NODE_NAME_MAP.PRODUCT_NAME_NODE, prdNameNode.id);
      }

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

  // 선택한 노드들 중 prdCard 이름과 엮인 노드들을 탐색
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

async function setProductCard(
  productList: { name: string; imageUrl: string }[],
) {
  const productCardIdMap = await figma.clientStorage.getAsync(
    PRODUCT_CARD_ID_MAP_KEY,
  );

  // 스토리지에 productCardIdMap이 존재하지 않는 경우 에러 알림 노출
  if (!productCardIdMap) {
    figma.notify(
      '선택한 프레임 중 유효한 프레임이 존재하지 않아 정상적으로 처리하지 못했습니다. 프레임명이 재대로 설정되어 있는지 확인해 주세요.',
      { error: true },
    );
    return;
  }

  const productCardIdMapValue = deserializeMap(productCardIdMap);

  Array.from(productCardIdMapValue)
    .map((val) => val[1])
    .forEach((map, index) => {
      const productImageNode = map.get(NODE_NAME_MAP.PRODUCT_IMAGE_NODE);
      const productNameNode = map.get(NODE_NAME_MAP.PRODUCT_NAME_NODE);

      // 이미지 노드이고, 상품 이미지 데이터가 존재하면 이미지 삽입
      if (productImageNode && productList[index]?.imageUrl) {
        addImageToNode(
          figma.getNodeById(productImageNode) as FrameNode | RectangleNode,
          productList[index].imageUrl,
        );
      }

      // 텍스트 노드이고, 상품명 데이터가 존재하면 상품명 지정
      if (productNameNode && productList[index]?.name) {
        addTextToNode(
          figma.getNodeById(productNameNode) as TextNode,
          productList[index].name,
        );
      }
    });

  // 스토리지 productCardIdMap 초기화
  await figma.clientStorage.setAsync(PRODUCT_CARD_ID_MAP_KEY, null);
}

export { validateSelectedNodes, setProductCard };
