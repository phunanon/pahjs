const { floor, random, min, max, hypot } = Math;
const assets: HTMLImageElement[] = [];

type Tile = {
  asset: HTMLImageElement;
  clickable?: boolean;
  highlight?: boolean;
};
type BoardTile = Tile & {
  clientX: number;
  clientY: number;
  x: number;
  y: number;
  z: number;
};
const trough: Tile[] = [];
const board: BoardTile[] = [];
const mouse = { x: 0, y: 0, clicked: false };

const boardLength = 8;
const tileWidth = 64;
const tileHeight = 96;
const faceX = 4;
const faceY = 4;

const shuffle = <T>(xs: T[], k = 0) => {
  const alreadyShuffled = new Set<number>();
  for (let i = xs.length - 1; i > 0; --i) {
    if (k && alreadyShuffled.has(i)) continue;
    const j = k
      ? max(0, i - k + floor(random() * k))
      : floor(random() * (i + 1));
    const temp = xs[i]!;
    xs[i] = xs[j]!;
    xs[j] = temp;
    alreadyShuffled.add(j);
  }
};

export const InitGame = async (ctx: CanvasRenderingContext2D) => {
  const orderedAssets = [...document.querySelectorAll('img')];
  shuffle(orderedAssets);
  assets.push(...orderedAssets.flatMap(x => [x, x]));
  shuffle(assets, 1);
  assets.push(...assets, ...assets, ...assets);

  {
    type XYZ = { x: number; y: number; z: number };
    const str = (x: number, y: number, z: number) =>
      JSON.stringify({ x, y, z });
    const obj = (s: string) => JSON.parse(s) as XYZ;
    const occupied = new Set<string>();
    const has = (xyz: XYZ, dx: number, dy: number) =>
      occupied.has(str(xyz.x + dx, xyz.y + dy, xyz.z));
    const space = new Set<string>([str(0, 0, 0)]);
    for (let i = 0; i < assets.length; ++i) {
      const asset = assets[i]!;
      const spaceIdx = floor(space.size * random());
      const sp = [...space][spaceIdx];
      if (!sp) break;
      const s = obj(sp);
      board.push({ asset, x: s.x, y: s.y, z: s.z, clientX: 0, clientY: 0 });
      occupied.add(sp);
      if (s.x > s.z * 2 && s.y > s.z * 2) {
        if (has(s, -2, 0) && has(s, -2, -2) && has(s, 0, -2))
          space.add(str(s.x - 1, s.y - 1, s.z + 1));
        if (has(s, 2, 0) && has(s, 2, 2) && has(s, 0, 2))
          space.add(str(s.x + 1, s.y + 1, s.z + 1));
        if (has(s, -2, 0) && has(s, -2, 2) && has(s, 0, 2))
          space.add(str(s.x - 1, s.y + 1, s.z + 1));
        if (has(s, 0, -2) && has(s, 2, -2) && has(s, 2, 0))
          space.add(str(s.x + 1, s.y - 1, s.z + 1));
      }
      if (!s.z) {
        space.add(str(s.x - 2, s.y + 0, s.z));
        space.add(str(s.x + 0, s.y + 0, s.z));
        space.add(str(s.x + 2, s.y + 0, s.z));
        space.add(str(s.x - 2, s.y + 2, s.z));
        space.add(str(s.x + 0, s.y + 2, s.z));
        space.add(str(s.x + 2, s.y + 2, s.z));
      }
      [...occupied].forEach(o => space.delete(o));
      [...space].forEach(s => {
        const o = obj(s);
        if (o.x < 0 || o.y < 0 || o.x > 14 || o.y > 14) space.delete(s);
      });
    }
  }

  ctx.canvas.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  ctx.canvas.addEventListener('mousedown', () => {
    mouse.clicked = true;
  });

  CalcClickable();
};

const RenderTile = (
  ctx: CanvasRenderingContext2D,
  tile: Tile | BoardTile,
  x: number,
  y: number,
  z: number,
) => {
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#000';
  ctx.translate((x / 2) * tileWidth, (y / 2) * tileHeight);
  ctx.translate(z * faceX, z * -faceY);

  const highlight = tile.highlight && tile.clickable;
  //Left side
  ctx.fillStyle = highlight ? '#0a0' : '#eee';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, tileHeight);
  ctx.lineTo(faceX, tileHeight - faceY);
  ctx.lineTo(faceX, -faceY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  //Front face
  ctx.fillStyle = highlight ? '#080' : '#ccc';
  ctx.beginPath();
  ctx.moveTo(0, tileHeight);
  ctx.lineTo(faceX, tileHeight - faceY);
  ctx.lineTo(tileWidth + faceX, tileHeight - faceY);
  ctx.lineTo(tileWidth, tileHeight);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  //Background
  ctx.fillStyle = highlight ? '#aaffbb' : '#fffadb';
  ctx.fillRect(faceX, -faceY, tileWidth, tileHeight);
  //Border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.strokeRect(faceX, -faceY, tileWidth, tileHeight);
  //Tile image
  ctx.drawImage(
    tile.asset,
    faceX + 2,
    -faceY + 2,
    tileWidth - faceX,
    tileHeight - faceY,
  );
  const point = new DOMPoint(0, 0).matrixTransform(ctx.getTransform());
  if ('clientX' in tile) {
    tile.clientX = point.x;
    tile.clientY = point.y;

    // //Euclidean distance brightening effect
    // //by darkening farther tiles
    // const distance = hypot(
    //   mouse.x - (tile.clientX + (tileWidth - faceX) / 2),
    //   mouse.y - (tile.clientY + (tileHeight - faceY) / 2),
    // );
    // const maxDistance = 300;
    // const clamped = min(distance, maxDistance);
    // const darkness = floor((clamped / maxDistance) * 64);
    // ctx.fillStyle = `rgba(0,0,0,${darkness / 255})`;
    const maxZ = 4;
    ctx.fillStyle = `rgba(0,0,0,${(maxZ - tile.z) / (maxZ * 4)})`;
    ctx.fillRect(faceX, -faceY, tileWidth, tileHeight);
  }

  ctx.restore();
};

const CalcClickable = () => {
  for (const tile of board) {
    const topBlocked = board.some(
      other =>
        other.z === tile.z + 1 &&
        other.x >= tile.x - 1 &&
        other.x <= tile.x + 1 &&
        other.y >= tile.y - 1 &&
        other.y <= tile.y + 1,
    );
    const neighbours = board.filter(
      other =>
        other != tile &&
        other.z === tile.z &&
        other.y === tile.y &&
        (other.x + 2 === tile.x || other.x - 2 === tile.x),
    );
    tile.clickable = !topBlocked && neighbours.length < 2;
  }
};

const HandleClick = () => {
  const clicked = board.find(tile => tile.highlight);
  if (!clicked?.clickable || trough.length === 4) return;
  //Remove similar from the trough if any
  const troughIdx = trough.findIndex(t => t.asset.src === clicked.asset.src);
  if (troughIdx >= 0) {
    trough.splice(troughIdx, 1);
  } else {
    trough.push({ asset: clicked.asset });
  }
  //Remove from board
  const idx = board.indexOf(clicked);
  if (idx >= 0) board.splice(idx, 1);
};

let introduction = 0;
export const Render = (ctx: CanvasRenderingContext2D) => {
  //Handle click
  if (mouse.clicked) {
    mouse.clicked = false;
    HandleClick();
    CalcClickable();
  }

  ctx.fillStyle = '#132a3d';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.save();
  const margin = 20;
  const troughHeight = tileHeight + margin * 2;
  // Scale to fill shortest dimension, accounting for DPR already applied
  const gameWidth = tileWidth * boardLength + margin * 2;
  const gameHeight = tileHeight * boardLength + troughHeight + margin * 3;
  const dpr = window.devicePixelRatio || 1;
  const scale = Math.min(
    (ctx.canvas.width / dpr) / gameWidth,
    (ctx.canvas.height / dpr) / gameHeight,
  );
  ctx.scale(scale, scale);

  //Trough
  ctx.fillStyle = '#654321';
  ctx.strokeStyle = '#442d15';
  ctx.lineWidth = 2;
  const troughWidth = (tileWidth + margin * 2) * 4;
  const troughX = gameWidth / 2 - troughWidth / 2;
  const tileSpace = tileWidth + margin * 2;
  for (let i = 0; i < 4; ++i) {
    ctx.save();
    ctx.translate(troughX + i * tileSpace, 0);
    ctx.fillRect(0, margin, tileWidth + margin * 2, troughHeight);
    ctx.strokeRect(0, margin, tileWidth + margin * 2, troughHeight);
    ctx.translate(margin, margin * 2);
    const tile = trough[i];
    if (tile) RenderTile(ctx, tile, 0, 0, 0);
    ctx.restore();
  }
  ctx.translate(margin, margin * 2 + troughHeight);

  //Figure out which tile is under the mouse
  const underMouse = board
    .filter(x => x.clickable)
    .reduce(
      (under, tile) => {
        tile.highlight = false;
        const clientX = tile.clientX ?? 0;
        const clientY = tile.clientY ?? 0;
        const isUnder =
          mouse.x >= clientX &&
          mouse.x <= clientX + (tileWidth + faceX) * scale &&
          mouse.y >= clientY - faceY * scale &&
          mouse.y <= clientY + tileHeight * scale;
        if (!isUnder) return under;
        if (under) return tile.z > under.z ? tile : under;
        return tile;
      },
      null as BoardTile | null,
    );
  if (underMouse) underMouse.highlight = true;

  const toDraw =
    introduction !== board.length ? board.slice(0, ++introduction) : board;
  const sorted = toDraw.toSorted((a, b) => {
    if (a.z > b.z) return 1;
    if (a.z < b.z) return -1;
    if (a.y > b.y) return 1;
    if (a.y < b.y) return -1;
    if (a.x > b.x) return -1;
    if (a.x < b.x) return 1;
    return 0;
  });
  sorted.forEach(tile => {
    RenderTile(ctx, tile, tile.x, tile.y, tile.z);
  });

  ctx.restore();
};
