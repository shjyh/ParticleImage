
self.onmessage = function (e) {
    const { imageData, pointsBase, density, width, height } = e.data;
    const halfW = width / 2;
    const halfH = height / 2;

    const targetPoints = [];
    const step = 2;
    for (let y = 0; y < imageData.height; y += step) {
        for (let x = 0; x < imageData.width; x += step) {
            const px = Math.round(x);
            const py = Math.round(y);
            const idx = (px + py * imageData.width) * 4;

            const r = imageData.data[idx] / 255;
            const g = imageData.data[idx + 1] / 255;
            const b = imageData.data[idx + 2] / 255;
            const a = imageData.data[idx + 3] / 255;

            // Luminance-based weight (darker = higher weight)
            const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            const weight = (1.0 - luminance) * a;

            if (weight > 0.1) {
                if (Math.random() < weight * 1.5) {
                    targetPoints.push([x, y]);
                }
            }
        }
    }

    if (targetPoints.length === 0) {
        for (let i = 0; i < pointsBase.length; i++) targetPoints.push([Math.random() * width, Math.random() * height]);
    }

    const nearestPoints = [];
    const nearestColors = [];
    const baseLen = pointsBase.length;
    const targetLen = targetPoints.length;

    for (let i = 0; i < baseLen; i++) {
        const bx = pointsBase[i][0];
        const by = pointsBase[i][1];

        let nearestIdx = -1;
        let minSqDist = Infinity;

        for (let j = 0; j < targetLen; j++) {
            const dx = targetPoints[j][0] - bx;
            const dy = targetPoints[j][1] - by;
            const sqDist = dx * dx + dy * dy;

            if (sqDist < minSqDist) {
                minSqDist = sqDist;
                nearestIdx = j;
            }
        }

        if (nearestIdx !== -1) {
            const target = targetPoints[nearestIdx];
            nearestPoints.push(target[0] - halfW, target[1] - halfH);

            const px = Math.round(target[0]);
            const py = Math.round(target[1]);
            const idx = (px + py * imageData.width) * 4;
            nearestColors.push(
                imageData.data[idx] / 255,
                imageData.data[idx + 1] / 255,
                imageData.data[idx + 2] / 255,
                imageData.data[idx + 3] / 255
            );
        } else {
            nearestPoints.push(bx - halfW, by - halfH);
            nearestColors.push(0, 0, 0, 0);
        }
    }

    self.postMessage({ nearestPoints, nearestColors });
};
