
self.onmessage = function (e) {
    const { imageData, pointsBase, density } = e.data;

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
        for (let i = 0; i < pointsBase.length; i++) targetPoints.push([Math.random() * 500, Math.random() * 500]);
    }

    const nearestPoints = [];
    const nearestColors = [];
    for (let i = 0; i < pointsBase.length; i++) {
        let nearestPoint = [pointsBase[i][0], pointsBase[i][1]];
        let nearestColor = [0, 0, 0, 0];
        let nearestDistance = Infinity;

        for (let j = 0; j < targetPoints.length; j++) {
            const d = Math.sqrt(Math.pow(targetPoints[j][0] - pointsBase[i][0], 2) + Math.pow(targetPoints[j][1] - pointsBase[i][1], 2));
            if (d < nearestDistance) {
                nearestDistance = d;
                nearestPoint = targetPoints[j];

                const px = Math.round(targetPoints[j][0]);
                const py = Math.round(targetPoints[j][1]);
                const idx = (px + py * imageData.width) * 4;
                nearestColor = [
                    imageData.data[idx] / 255,
                    imageData.data[idx + 1] / 255,
                    imageData.data[idx + 2] / 255,
                    imageData.data[idx + 3] / 255
                ];
            }
        }
        nearestPoints.push(nearestPoint[0] - 250, nearestPoint[1] - 250);
        nearestColors.push(nearestColor[0], nearestColor[1], nearestColor[2], nearestColor[3]);
    }

    self.postMessage({ nearestPoints, nearestColors });
};
