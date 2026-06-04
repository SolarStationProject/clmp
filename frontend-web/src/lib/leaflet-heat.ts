// leaflet-heat — versión ES module embebida localmente
// Basada en https://github.com/Leaflet/Leaflet.heat (MIT License)
// Incluye simpleheat inline para evitar dependencia de npm y problemas de CDN

import L from 'leaflet';

// ── simpleheat core ──────────────────────────────────────────────────────────

function simpleheat(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')!;
    let _r = 0, _max = 1;
    let _data: number[][] = [];
    const _grad: Record<number, string> = {
        0.4: 'blue', 0.65: 'lime', 1: 'red',
    };
    let _circle: HTMLCanvasElement | undefined;

    function createCircle(r: number) {
        const blur = Math.floor(r / 2);
        const c = document.createElement('canvas');
        const ctx2 = c.getContext('2d')!;
        _r = r + blur;
        c.width = c.height = _r * 2;
        ctx2.shadowOffsetX = ctx2.shadowOffsetY = _r * 2;
        ctx2.shadowBlur = blur;
        ctx2.shadowColor = 'black';
        ctx2.beginPath();
        ctx2.arc(-_r, -_r, r, 0, Math.PI * 2, true);
        ctx2.closePath();
        ctx2.fill();
        _circle = c;
    }

    function createGradient(grad: Record<number, string>) {
        const c = document.createElement('canvas');
        const ctx2 = c.getContext('2d')!;
        c.width = 1; c.height = 256;
        const gradient = ctx2.createLinearGradient(0, 0, 0, 256);
        for (const stop in grad) gradient.addColorStop(+stop, grad[stop]);
        ctx2.fillStyle = gradient;
        ctx2.fillRect(0, 0, 1, 256);
        return ctx2.getImageData(0, 0, 1, 256).data;
    }

    const sh = {
        data(d: number[][]) { _data = d; return sh; },
        max(m: number)      { _max = m;  return sh; },
        radius(r: number)   { createCircle(r); return sh; },
        gradient(grad: Record<number, string>) {
            Object.assign(_grad, grad);
            return sh;
        },
        draw(minOpacity = 0.05) {
            if (!_circle) createCircle(25);
            const colored = createGradient(_grad);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (const p of _data) {
                ctx.globalAlpha = Math.max(p[2] / _max, minOpacity);
                ctx.drawImage(_circle!, p[0] - _r, p[1] - _r);
            }
            ctx.globalAlpha = 1;

            const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = image.data;
            for (let i = 0; i < pixels.length; i += 4) {
                const v = pixels[i + 3] * 4;
                if (v) {
                    pixels[i]     = colored[v];
                    pixels[i + 1] = colored[v + 1];
                    pixels[i + 2] = colored[v + 2];
                }
            }
            ctx.putImageData(image, 0, 0);
            return sh;
        },
    };
    return sh;
}

// ── Leaflet HeatLayer ────────────────────────────────────────────────────────

const HeatLayer = (L.Layer as any).extend({
    options: {
        minOpacity: 0.05,
        maxZoom:    18,
        radius:     25,
        blur:       15,
        max:        1.0,
    },

    initialize(latlngs: number[][], options: Record<string, unknown>) {
        this._latlngs = latlngs;
        L.setOptions(this, options);
    },

    setLatLngs(latlngs: number[][]) {
        this._latlngs = latlngs;
        return this.redraw();
    },

    addLatLng(latlng: number[]) {
        this._latlngs.push(latlng);
        return this.redraw();
    },

    redraw() {
        if (this._heat) this._draw();
        return this;
    },

    onAdd(map: L.Map) {
        this._map = map;
        if (!this._canvas) this._initCanvas();
        (map as any).getPane('overlayPane').appendChild(this._canvas);
        map.on('moveend', this._reset, this);
        if ((map as any).options.zoomAnimation && (L.Browser as any).any3d) {
            map.on('zoomanim', this._animateZoom, this);
        }
        this._reset();
        return this;
    },

    onRemove(map: L.Map) {
        (map as any).getPane('overlayPane').removeChild(this._canvas);
        map.off('moveend', this._reset, this);
        if ((map as any).options.zoomAnimation) {
            map.off('zoomanim', this._animateZoom, this);
        }
        return this;
    },

    _initCanvas() {
        const canvas = this._canvas = document.createElement('canvas');
        canvas.className = 'leaflet-layer';

        const animated = (this._map as any).options.zoomAnimation && (L.Browser as any).any3d;
        L.DomUtil.addClass(canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));

        const size = this._map.getSize();
        canvas.width  = size.x;
        canvas.height = size.y;

        this._heat = simpleheat(canvas);
        this._updateOptions();
    },

    _updateOptions() {
        this._heat.radius(this.options.radius, this.options.blur);
        if (this.options.gradient) this._heat.gradient(this.options.gradient);
        if (this.options.max)      this._heat.max(this.options.max);
    },

    _reset() {
        const topLeft = this._map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this._canvas, topLeft);

        const size = this._map.getSize();
        if (this._heat._width  !== size.x) { this._canvas.width  = this._heat._width  = size.x; }
        if (this._heat._height !== size.y) { this._canvas.height = this._heat._height = size.y; }
        this._draw();
    },

    _draw() {
        if (!this._map) return;
        const r = this._heat._r || this.options.radius;
        const size = this._map.getSize();
        const bounds = new (L as any).Bounds(
            (L as any).point([-r, -r]),
            size.add([r, r])
        );
        const zoom = this._map.getZoom();
        const maxZoom   = this.options.maxZoom !== undefined ? this.options.maxZoom : this._map.getMaxZoom();
        const v  = 1 / Math.pow(2, Math.max(0, Math.min(maxZoom - zoom, 12)));
        const cellSize = Math.round(r / 2);
        const grid: Record<string, number[]> = {};
        const panePos = (this._map as any)._getMapPanePos();
        const offsetX = panePos.x % cellSize;
        const offsetY = panePos.y % cellSize;
        const data: number[][] = [];

        for (const p of this._latlngs) {
            if (p.length === 2) p.push(1);
            const latlng = L.latLng(p[0], p[1]);
            if (!bounds.contains((this._map as any).latLngToContainerPoint(latlng))) continue;

            const x = Math.floor((this._map as any).latLngToContainerPoint(latlng).x - offsetX) + offsetX;
            const y = Math.floor((this._map as any).latLngToContainerPoint(latlng).y - offsetY) + offsetY;
            const key = `${x},${y}`;
            const alt = p[2] * v;
            if (grid[key]) {
                grid[key][2] = Math.max(grid[key][2], alt);
            } else {
                grid[key] = [x, y, alt];
            }
        }
        for (const key in grid) data.push(grid[key]);

        this._heat.data(data).draw(this.options.minOpacity);

        this._frame = null;
    },

    _animateZoom(e: any) {
        const scale  = this._map.getZoomScale(e.zoom);
        const offset = this._map._getCenterOffset(e.center)._multiplyBy(-scale).subtract(this._map._getMapPanePos());
        if ((L.DomUtil as any).setTransform) {
            (L.DomUtil as any).setTransform(this._canvas, offset, scale);
        } else {
            (this._canvas as any).style[L.DomUtil.TRANSFORM] = `${L.DomUtil.getTranslateString(offset)} scale(${scale})`;
        }
    },
});

// Registra L.heatLayer en el namespace de Leaflet
(L as any).heatLayer = function(latlngs: number[][], options: Record<string, unknown>) {
    return new HeatLayer(latlngs, options);
};

export {};
