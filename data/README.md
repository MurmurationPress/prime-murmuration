# Packaged world land

`world-land.js` is derived from Natural Earth 1:110m land polygons:
https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson

Source Git blob: `04811d72fff2701ec67587e30ad8942675b511e3`.
Natural Earth data is public domain: https://www.naturalearthdata.com/about/terms-of-use/

Conversion: extract each Polygon's coordinate rings (flatten MultiPolygons if
present), round longitude and latitude to three decimal places, and export the
resulting array as `WORLD_LAND`. All 127 polygons, including interior rings, are
retained. No country boundaries, labels, remote requests, or third-party runtime
are introduced. At this scale, small islands and coastal detail are simplified.
The renderer fills interior water rings as sea; land membership excludes them.
