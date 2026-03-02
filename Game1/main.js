(function () {
    let blockImgs = {}
    let blockSrc = {}
    let names = [
        "bedrock",
        "dirt",
        "flower1",
        "flower2",
        "grass",
        "grassblock",
        "sand",
        "stone1",
        "stone2",
        "stone3",
        "stone4",
        "stone5",
        "stone6",

        "ore1", "ore2", "ore3", "ore4", "ore5", "ore6", "ore7", "ore8", "ore9",
        "ore10", "ore11", "ore12", "ore13", "ore14", "ore15", "ore16", "ore17", "ore18", "ore19", "ore20",
        "ore21", "ore22", "ore23",
    ]
    let pickaxeImgs = {}

    let pickaxeSrc = {}
    for (let i = 1; i <= 15; i++) pickaxeSrc["pickaxe" + i] = `./assets/pickaxes/pickaxe${i}.png`
    for (let n of names) blockSrc[n] = `./assets/blocks/${n}.png`
    function loadImagesInto(dest, map, done) {
        let left = Object.keys(map).length
        for (let key in map) {
            let img = new Image()
            img.src = map[key]
            img.onload = () => { if (--left === 0) done && done() }
            img.onerror = () => console.error("failed to load", map[key])
            dest[key] = img
        }
    }
    loadImagesInto(blockImgs, blockSrc, () => console.log("blocks loaded"))
    loadImagesInto(pickaxeImgs, pickaxeSrc, () => console.log("pickaxes loaded"))
    let qus = (k) => document.querySelector(k)
    let canvas = qus('canvas')
    window.canvas = canvas
    let ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false
    let width;
    let height;
    let dpr;
    let floor = Math.floor
    let round = Math.round
    let rect
    function resize() {
        dpr = window.devicePixelRatio || 1;
        let w = window.innerWidth;
        let h = window.innerHeight;

        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        width = canvas.width = Math.floor(w * dpr);
        height = canvas.height = Math.floor(h * dpr);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = false
    }

    window.addEventListener("resize", resize);
    resize();
    let keysPressed = {}
    addEventListener('keydown', function (k) {
        keysPressed[k.key.toLowerCase()] = true
    })
    addEventListener('keyup', function (k) {
        keysPressed[k.key.toLowerCase()] = false
    })
    // canvas.addEventListener("wheel", e => {
    //     e.preventDefault();
    //     if (e.deltaY > 0) zoom /= 1.1
    //     else zoom *= 1.1
    // });
    addEventListener('mousemove', function (k) {
        mouse.x = k.clientX * dpr
        mouse.y = k.clientY * dpr
    })
    addEventListener('mousedown', function (k) {
        mouse.down = true
    })
    addEventListener('mouseup', function (k) {
        mouse.down = false
    })

    let last = 0
    let step = 1000 / 60
    let upgradeMsgUntil = 0

    function tick(now) {
        if (now - last < step) {
            requestAnimationFrame(tick)
            return
        }
        last = now

        ctx.resetTransform()
        ctx.fillStyle = "#72E7FF"
        ctx.fillRect(0, 0, width, height)

        scrollx = player.x + (mouse.x - width / 2) / 2
        scrolly = player.y + (mouse.y - height / 2) / 2

        mouse.tick()
        player.tick()
        player.tick()

        let top = scrolly - (height / 2) / zoom
        let bottom = scrolly + (height / 2) / zoom
        let minRow = Math.floor((top - 128) / 256)
        let maxRow = Math.floor((bottom + 128) / 256)

        for (let gy = minRow; gy <= maxRow; gy++) {
            let row = blocks[gy]
            if (!row) continue
            for (let gx in row) row[gx].tick()
        }

        player.draw()
        mouse.draw()

        ctx.resetTransform()
        ctx.fillStyle = "#fff"
        ctx.font = `${Math.round(56 * dpr)}px Bahnschrift, Segoe UI, Verdana, sans-serif`
        ctx.textAlign = "right"
        ctx.textBaseline = "top"
        ctx.fillText(`$${money}`, width - Math.round(16 * dpr), Math.round(12 * dpr))
        ctx.resetTransform()

        let pad = Math.round(16 * dpr)
        let icon = Math.round(64 * dpr)

        let next = Math.min(player.pickaxe + 1, 15)
        let priceText = (player.pickaxe >= 15)
            ? "Max pickaxe"
            : `Next: $${pickaxePrice["pickaxe" + next]}`

        ctx.fillStyle = "#fff"
        ctx.font = `${Math.round(56 * dpr)}px Bahnschrift, Segoe UI, Verdana, sans-serif`
        ctx.textAlign = "left"
        ctx.textBaseline = "bottom"
        ctx.fillText(priceText, pad + icon + Math.round(12 * dpr), height - pad)

        if (player.pickaxe < 15) {
            let img = pickaxeImgs["pickaxe" + next]
            if (img && img.complete) {
                ctx.drawImage(img, pad, height - pad - icon, icon, icon)
            }
            if (money >= pickaxePrice["pickaxe" + next]) {
                money -= pickaxePrice["pickaxe" + next]
                player.pickaxe++
                upgradeMsgUntil = performance.now() + 2000
            }
        }
        if (performance.now() < upgradeMsgUntil) {
            ctx.fillStyle = "#00ff00"
            ctx.font = `bold ${Math.round(64 * dpr)}px Bahnschrift, Segoe UI, Verdana, sans-serif`
            ctx.textAlign = "center"
            ctx.textBaseline = "top"
            ctx.fillText("Pickaxe Upgraded!", width / 2, Math.round(12 * dpr))
        }

        requestAnimationFrame(tick)
    }

    let scrollx = 0;
    let scrolly = 0;
    let zoom = 0.5;
    function scroll() {
        ctx.setTransform(zoom, 0, 0, zoom, round(-scrollx * zoom + width / 2), round(-scrolly * zoom + height / 2))
    }
    function dist(a, b, c = 0, d = 0) {
        return Math.hypot(a, b, c, d)
    }


    class Player {
        constructor() {
            this.x = 0;
            this.y = 0;
            this.vx = 0;
            this.vy = 0;
            this.pickaxe = 1
            this.facing = 1
        }
        tick() {
            this.move()
        }
        move() {
            if (keysPressed.a) this.facing = -1
            if (keysPressed.d) this.facing = 1
            keysPressed.a && (this.vx -= 5)
            keysPressed.d && (this.vx += 5)
            this.vx *= 0.7;
            this.vy *= 0.99;
            this.x += this.vx;
            let c = this.collision()
            if (c) {
                if (this.vx > 0) this.x = c.x - 128 - 80
                if (this.vx < 0) this.x = c.x + 128 + 80
                this.vx = 0;
            }
            this.vy += 0.5;
            this.y += this.vy;
            c = this.collision()
            if (c) {
                if (this.vy > 0) {
                    this.y = c.y - 128 - 80
                    if (keysPressed.w) {
                        this.vy = -28
                    } else {
                        this.vy = 0;
                    }
                }
                else if (this.vy < 0) {
                    this.y = c.y + 128 + 80
                    this.vy = 0;
                }
            }
        }
        collision() {
            let gy = Math.round(this.y / 256)
            let gx = Math.round(this.x / 256)

            for (let ry = gy - 1; ry <= gy + 1; ry++) {
                let row = blocks[ry]
                if (!row) continue

                for (let rx = gx - 1; rx <= gx + 1; rx++) {
                    let block = row[rx]
                    if (!block || !block.collidable) continue

                    if (
                        this.x + 80 > block.x - 128 &&
                        this.x - 80 < block.x + 128 &&
                        this.y + 80 > block.y - 128 &&
                        this.y - 80 < block.y + 128
                    ) return block
                }
            }

            return false
        }
        draw() {
            scroll()
            ctx.translate(this.x, this.y)
            ctx.save()
            ctx.scale(this.facing, 1)
            ctx.fillStyle = "#000"
            ctx.fillRect(-80, -80, 160, 160)

            let img = pickaxeImgs["pickaxe" + this.pickaxe]
            if (img && img.complete) {
                let t = performance.now() / 1000
                let hold = -0.4
                let swing = mouse.down ? Math.sin(t * 18) * 0.35 : 0
                let ang = hold + swing

                let size = 128
                let handX = 70
                let handY = -20
                let pivotX = 20
                let pivotY = 108

                ctx.save()
                ctx.translate(handX, handY)
                ctx.rotate(ang)
                ctx.drawImage(img, -pivotX, -pivotY, size, size)
                ctx.restore()
            }

            ctx.restore()
        }
    }
    let hardness = {
        bedrock: 999999,
        dirt: 0.25,
        grass: 0.2,
        grassblock: 0.3,
        sand: 0.15,
        flower1: 0,
        flower2: 0,

        stone1: 1,
        stone2: 2,
        stone3: 4,
        stone4: 8,
        stone5: 16,
        stone6: 32,
        ore1: 1.2, ore2: 1.4, ore3: 1.6,
        ore4: 2.4, ore5: 2.8, ore6: 3.2, ore7: 3.6,
        ore8: 4.8, ore9: 5.6, ore10: 6.4, ore11: 7.2,
        ore12: 9.6, ore13: 11.2, ore14: 12.8, ore15: 14.4,
        ore16: 19.2, ore17: 22.4, ore18: 25.6, ore19: 28.8,
        ore20: 38.4, ore21: 44.8, ore22: 51.2, ore23: 57.6,
    }
    let money = 0;
    let values = {
        ore1: 10,
        ore2: 15,
        ore3: 25,

        ore4: 40,
        ore5: 65,
        ore6: 105,
        ore7: 170,

        ore8: 275,
        ore9: 445,
        ore10: 720,
        ore11: 1165,

        ore12: 1885,
        ore13: 3050,
        ore14: 4935,
        ore15: 7985,

        ore16: 12920,
        ore17: 20905,
        ore18: 33825,
        ore19: 54730,

        ore20: 88555,
        ore21: 143285,
        ore22: 231840,
        ore23: 375125,
    }

    let pickaxePrice = {
        pickaxe1: 0,
        pickaxe2: 100,
        pickaxe3: 250,
        pickaxe4: 600,
        pickaxe5: 1400,
        pickaxe6: 3200,
        pickaxe7: 7200,
        pickaxe8: 16000,
        pickaxe9: 35000,
        pickaxe10: 75000,
        pickaxe11: 160000,
        pickaxe12: 340000,
        pickaxe13: 720000,
        pickaxe14: 1500000,
        pickaxe15: 3100000,
    }
    let pickaxeEff = {
        pickaxe1: 1.0,
        pickaxe2: 1.4,
        pickaxe3: 2.0,
        pickaxe4: 2.8,
        pickaxe5: 3.9,
        pickaxe6: 5.5,
        pickaxe7: 7.7,
        pickaxe8: 10.8,
        pickaxe9: 15.1,
        pickaxe10: 21.1,
        pickaxe11: 29.5,
        pickaxe12: 41.3,
        pickaxe13: 57.8,
        pickaxe14: 80.9,
        pickaxe15: 113.3,
    }
    function airDist5(gx, gy) {
        let isSolid = (x, y) => {
            let b = blocks[y] && blocks[y][x]
            if (!b) return false
            return b.type !== "grass" && b.type !== "flower1" && b.type !== "flower2"
        }

        for (let d = 0; d <= 5; d++) {
            for (let dx = -d; dx <= d; dx++) {
                let dy = d - Math.abs(dx)

                let x1 = gx + dx, y1 = gy + dy
                if (!isSolid(x1, y1)) return d

                if (dy !== 0) {
                    let x2 = gx + dx, y2 = gy - dy
                    if (!isSolid(x2, y2)) return d
                }
            }
        }
        return 5
    }
    class Block {
        constructor(gx, gy, type) {
            this.gx = gx
            this.gy = gy
            this.x = gx * 256
            this.y = gy * 256

            this.startBreaking = performance.now()
            this.break = 0
            this.type = type
            this.health = hardness[type]
            this.collidable = true
            if (['flower1', 'flower2', 'grass'].includes(type)) this.collidable = false

            let stages = []
            for (let v = 1; v <= 10; v++) {
                let count = v <= 6 ? 26 : 25
                for (let i = 0; i < count; i++) stages.push(v)
            }

            let seed = (gx * 73856093) ^ (gy * 19349663)
            let rng = () => {
                seed = (seed * 1664525 + 1013904223) >>> 0
                return seed / 4294967296
            }

            for (let i = stages.length - 1; i > 0; i--) {
                let j = (rng() * (i + 1)) | 0
                let t = stages[i]
                stages[i] = stages[j]
                stages[j] = t
            }

            this.breakMap = []
            for (let y = 0; y < 8; y++) {
                let row = []
                for (let x = 0; x < 8; x++) row.push(stages[y * 8 + x])
                this.breakMap.push(row)
            }
        }

        tick() {
            this.mouseover =
                mouse.sx > this.x - 128 && mouse.sx < this.x + 128 &&
                mouse.sy > this.y - 128 && mouse.sy < this.y + 128

            if (!this.mouseover || !mouse.down) {
                this.startBreaking = performance.now()
            }

            this.break = (performance.now() - this.startBreaking) / (1000 * this.health) * pickaxeEff["pickaxe" + player.pickaxe]
            if (this.break < 0) this.break = 0

            if (this.break >= 1 && mouse.down && this.mouseover) {
                this.broke()
                return
            }

            this.draw()
        }

        broke() {
            if (blocks[this.gy]) delete blocks[this.gy][this.gx]
            if (values[this.type]) {
                money += values[this.type]
            } else {
                money++;
            }
        }

        draw() {
            scroll()
            ctx.translate(this.x, this.y)

            ctx.fillStyle = "#fff"
            ctx.fillRect(-128, -128, 256, 256)

            let img = blockImgs[this.type]
            if (!img || !img.complete) return
            ctx.drawImage(img, -128, -128, 256, 256)

            let d = airDist5(this.gx, this.gy) - 1
            let a = d / 4
            if (a > 0) {
                ctx.fillStyle = `rgba(0,0,0,${a})`
                ctx.fillRect(-128, -128, 256, 256)
            }

            if (!(mouse.down && this.mouseover)) return

            let stage = Math.floor(this.break * 6) + 1
            if (stage < 1) stage = 1
            if (stage > 10) stage = 10

            ctx.fillStyle = "#000"
            for (let y = 0; y < 8; y++) {
                let row = this.breakMap[y]
                for (let x = 0; x < 8; x++) {
                    if (row[x] <= stage) {
                        ctx.fillRect(-128 + x * 32, -128 + y * 32, 32, 32)
                    }
                }
            }
        }
    }
    class Mouse {
        constructor() {
            this.x = 0
            this.y = 0
            this.down = false;
        }
        tick() {
            this.sx = (this.x - width / 2) / zoom + scrollx
            this.sy = (this.y - height / 2) / zoom + scrolly

            let dx = this.sx - player.x
            let dy = this.sy - player.y
            let d = dist(dx, dy)

            if (d > 1024) {
                let s = 1024 / d
                this.sx = player.x + dx * s
                this.sy = player.y + dy * s
            }
        }
        draw() {
            scroll()
            let bx = Math.round(this.sx / 256) * 256
            let by = Math.round(this.sy / 256) * 256
            ctx.translate(bx, by)
            ctx.fillStyle = "#fff"
            ctx.fillRect(-128, -144, 256, 16)
            ctx.fillRect(-128, 128, 256, 16)
            ctx.fillRect(-144, -128, 16, 256)
            ctx.fillRect(128, -128, 16, 256)
        }
    }
    let mouse = new Mouse();
    let player = new Player();
    let blocks = {}
    let minX = -200
    let maxX = 200
    let minY = -20
    let maxY = 250
    let worldSeed = (Math.random() * 2 ** 32) >>> 0

    function hash(n) {
        n = (n ^ (n >>> 16)) >>> 0
        n = Math.imul(n, 0x7feb352d) >>> 0
        n = (n ^ (n >>> 15)) >>> 0
        n = Math.imul(n, 0x846ca68b) >>> 0
        n = (n ^ (n >>> 16)) >>> 0
        return n / 4294967296
    }

    function rand2(x, s) {
        return hash((x * 374761393 + s * 668265263 + worldSeed * 1442695041) >>> 0)
    }

    function smooth1(x, s) {
        let x0 = Math.floor(x)
        let t = x - x0
        t = t * t * (3 - 2 * t)
        let a = rand2(x0, s)
        let b = rand2(x0 + 1, s)
        return a + (b - a) * t
    }

    function fbm(x, s) {
        let v = 0
        let a = 1
        let f = 1 / 32
        for (let i = 0; i < 4; i++) {
            v += a * smooth1(x * f, s + i * 97)
            a *= 0.5
            f *= 2
        }
        return v
    }
    let oreRanges = {
        1: [1, 3],
        2: [4, 7],
        3: [8, 11],
        4: [12, 15],
        5: [16, 19],
        6: [20, 23],
    }

    function clamp(v, a, b) { return v < a ? a : v > b ? b : v }

    function pickOreForStone(idx, x, y) {
        let r = oreRanges[idx]
        if (!r) return null
        let lo = r[0], hi = r[1]
        let n = lo + ((rand2(x + y * 131, 900 + idx) * (hi - lo + 1)) | 0)
        return "ore" + n
    }

    function stoneTierAt(x, y, dirtBottom) {
        let jitter = (fbm(x, 555) - 0.5) * 14
        let depth = y - (dirtBottom + 1) + jitter
        let idx = 1 + Math.floor(depth / 40)
        return clamp(idx, 1, 6)
    }

    function generateWorld() {
        for (let y = minY; y <= maxY; y++) blocks[y] = {}

        for (let x = minX; x <= maxX; x++) {
            let hill = (fbm(x, 11) - 0.5) * 10
            let surfaceY = Math.round(hill)

            let sandNoise = fbm(x * 3, 99)
            let sandPatch = sandNoise > 0.95
            let sandDepth = sandPatch ? (1 + Math.floor(rand2(x, 101) * 3)) : 0

            let dirtThickness = 4 + Math.floor(rand2(x, 21) * 3)
            let dirtTop = surfaceY + 1
            let dirtBottom = surfaceY + dirtThickness + sandDepth

            blocks[surfaceY][x] = new Block(x, surfaceY, sandPatch ? "sand" : "grassblock")

            let deco = rand2(x, 7)
            if (deco < 0.12) blocks[surfaceY - 1][x] = new Block(x, surfaceY - 1, deco < 0.03 ? "flower2" : deco < 0.06 ? "flower1" : "grass")

            for (let y = dirtTop; y <= dirtBottom; y++) {
                blocks[y][x] = new Block(x, y, sandPatch && y <= surfaceY + sandDepth ? "sand" : "dirt")
            }

            for (let y = dirtBottom + 1; y < maxY; y++) {
                let jitter = (fbm(x, 555) - 0.5) * 14
                let depth = y - (dirtBottom + 1) + jitter
                let idx = 1 + Math.floor(depth / 40)
                if (idx < 1) idx = 1
                if (idx > 6) idx = 6
                blocks[y][x] = new Block(x, y, "stone" + idx)
            }

            for (let y = maxY - 9; y <= maxY; y++) {
                blocks[y][x] = new Block(x, y, "bedrock")
            }
            let patchesHere = 10

            for (let p = 0; p < patchesHere; p++) {
                let y0 = dirtBottom + 3 + ((rand2(x + p * 999, 779) * (maxY - (dirtBottom + 6))) | 0)
                if (y0 >= maxY) continue
                let size = 2 + ((rand2(x + y0, 780 + p) * 7) | 0)
                let tier = stoneTierAt(x, y0, dirtBottom)
                let oreType = pickOreForStone(tier, x + p * 17, y0)
                if (!oreType) continue
                let px = x
                let py = y0
                for (let i = 0; i < size; i++) {
                    if (py <= dirtBottom || py >= maxY) break
                    let cell = blocks[py] && blocks[py][px]
                    if (cell && cell.type && cell.type.startsWith("stone")) {
                        blocks[py][px] = new Block(px, py, oreType)
                    }
                    let r = rand2(px + py * 997 + i * 123, 781 + p)
                    if (r < 0.25) px++
                    else if (r < 0.50) px--
                    else if (r < 0.75) py++
                    else py--
                }
            }
        }
    }

    generateWorld()
    tick();
})()