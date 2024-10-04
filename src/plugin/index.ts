import { isPayloadMessage } from '../ui/lib/figma';

async function addImageToFrame(frame: FrameNode, imageUrl: string) {
  try {
    // 이미 이미지가 삽입되어 있으면 중복 삽입되지 않게 리턴
    if (
      Array.isArray(frame.fills) &&
      frame.fills.length > 0 &&
      frame.fills.some((fill) => fill.type === 'IMAGE')
    ) {
      return;
    }

    const image = await figma.createImageAsync(imageUrl);

    const imageFill: ImagePaint = {
      type: 'IMAGE',
      scaleMode: 'FILL',
      imageHash: image.hash,
    };

    // eslint-disable-next-line no-param-reassign
    frame.fills = [imageFill];
  } catch (error) {
    figma.notify('이미지를 로드하는데 실패하였습니다.', { error: true });
  }
}

figma.showUI(__html__, {
  width: 500,
  height: 400,
  title: 'Kurly Product Design Plugin (프로토타입)',
});

figma.ui.onmessage = async (payload: unknown) => {
  if (isPayloadMessage(payload)) {
    const { type, data: imageUrlList } = payload;

    if (type === 'randomKurlyProductImage') {
      const selectedNodes = figma.currentPage.selection;

      const selectedFrames = selectedNodes.filter(
        (node) => node.type === 'FRAME',
      ) as FrameNode[];

      if (selectedFrames.length === 0) {
        figma.notify(
          '프레임이 선택되지 않았습니다. 이미지를 삽입하고 싶은 프레임을 선택해주세요.',
          { error: true },
        );
        return;
      }

      selectedFrames.forEach((frame, index) => {
        addImageToFrame(frame, imageUrlList[index]);
      });
    }
  }
};
