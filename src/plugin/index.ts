import { isPayloadMessage } from '../ui/lib/figma';

figma.showUI(__html__, {
  width: 500,
  height: 400,
  title: 'Kurly Product Design Plugin (프로토타입)',
});

figma.ui.onmessage = (payload: unknown) => {
  if (isPayloadMessage(payload)) {
    const { type, data } = payload;

    if (type === 'randomKurlyProductImage') {
      const wrapper = figma.createFrame();
      wrapper.resize(168, 400);
      wrapper.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
      wrapper.layoutMode = 'VERTICAL';
      wrapper.itemSpacing = 12;

      figma.createImageAsync(data).then(async (image: Image) => {
        const imageNode = figma.createRectangle();
        // const { width, height } = await image.getSizeAsync();
        // console.log(width, height);

        imageNode.resize(168, 218);
        imageNode.fills = [
          {
            type: 'IMAGE',
            imageHash: image.hash,
            scaleMode: 'FILL',
          },
        ];

        const rectNode1 = figma.createRectangle();
        rectNode1.resize(148, 22);
        rectNode1.fills = [
          {
            type: 'SOLID',
            color: { r: 236 / 255, g: 239 / 255, b: 243 / 255 },
          },
        ];
        rectNode1.cornerRadius = 4;

        const rectNode2 = figma.createRectangle();
        rectNode2.resize(100, 22);
        rectNode2.fills = [
          {
            type: 'SOLID',
            color: { r: 236 / 255, g: 239 / 255, b: 243 / 255 },
          },
        ];
        rectNode2.cornerRadius = 4;

        wrapper.appendChild(imageNode);
        wrapper.appendChild(rectNode1);
        wrapper.appendChild(rectNode2);
      });
    }
  }
};
