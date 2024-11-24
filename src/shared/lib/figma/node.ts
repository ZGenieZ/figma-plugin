import { INVALIDATE_NODE_TYPES } from '../../constants';

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

export {
  addImageToNode,
  addTextToNode,
  findAllNodesByName,
  findParentNodeByName,
  findChildrenNodesByName,
  findChildrenNodeByName,
};
