# ParticleImage

基于 Three.js 开发的高性能 3D 粒子变形特效库。支持将粒子平滑地聚合形成特定的图像（支持 路径、Base64 或 SVG 源码），并带有高性能的着色器动画效果。

video.mp4

## 安装

```bash
npm install particle-image
```

## 基础用法

```javascript
import { ParticleImage } from 'particle-image';

const canvas = document.getElementById('canvas');
const effect = new ParticleImage(canvas, {
    theme: 'dark',        // 'dark' | 'light' (默认: 'dark')
    color: '#aecbfa',     // 粒子基础颜色
    density: 200,         // 粒子密度/数量 (默认: 150)
    particlesScale: 0.6,  // 聚合图像的缩放比例 (默认: 0.5)
    cameraZoom: 3.5,      // 摄像机焦距/透视距离 (默认: 3.5)
    duration: 0.8         // 动画切换时长，单位秒 (默认: 0.6)
});

// 变形为指定图片
await effect.render('./path/to/image.png');

// 将粒子散开回到背景随机漫游状态
effect.scatter();

// 销毁实例并释放内存
effect.destroy();
```

## 配置项 (Options)

| 属性 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `theme` | `string` | `'dark'` | 视觉主题 (`'dark'` 或 `'light'`)。影响背景色及默认粒子颜色。 |
| `color` | `string` | *根据主题* | 粒子在随机漫游状态下的 Hex 颜色值。深色主题默认为浅蓝，浅色主题默认为深灰。 |
| `density` | `number` | `150` | 粒子密集度。值越大粒子越多，形成的图像越清晰。 |
| `particlesScale` | `number` | `0.5` | 聚合图像相对于画布的大小比例。 |
| `cameraZoom` | `number` | `3.5` | 透视缩放。值越小广角畸变越强，值越大画面越趋于平整。 |
| `duration` | `number` | `0.6` | `render()` 和 `scatter()` 状态切换动画的持续时间。 |

## API 接口

### `render(imageSource)`
- **参数**: `imageSource` (String: URL 路径, Base64 数据, 或原生 SVG 字符串)。
- **返回值**: `Promise<void>`
- **说明**: 触发粒子聚合动画。内置 LRU 缓存，相同图片的重复调用将通过缓存瞬时完成。

### `scatter()`
- **说明**: 触发粒子散开动画，使其回到初始的随机分布背景状态。

### `destroy()`
- **说明**: 停止动画循环并彻底释放实例占用的所有显存与内存资源。建议在组件销毁时调用，以确保没有内存泄漏。

## 开源协议

MIT
