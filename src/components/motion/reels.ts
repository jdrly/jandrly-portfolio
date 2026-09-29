/** Let the glyph reels spin again (their CSS animation), e.g. before the route curtain covers the page. */
export function spinGlyphReels(container: ParentNode): void {
    for (const reel of container.querySelectorAll<SVGElement>('.glyph-reel')) {
        reel.style.removeProperty('animation')
        reel.style.removeProperty('transform')
    }
}
