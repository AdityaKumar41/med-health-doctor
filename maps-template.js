export default `
<div>
    <style>
            html, body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            }

            #map {
                height: 100%;
                width: 100%;
            }
            
            .custom-marker {
                background-color: #0066CC;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                display: flex;
                justify-content: center;
                align-items: center;
                color: white;
                font-weight: bold;
                border: 3px solid white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                position: relative;
            }
            
            .custom-marker::after {
                content: '📍';
                font-size: 18px;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }
            
            .doctor-popup .tt-popup-content {
                padding: 8px 12px;
                border-radius: 8px;
                max-width: 200px;
            }
            
            .popup-content {
                text-align: center;
            }
            
            .popup-content strong {
                display: block;
                margin-bottom: 4px;
                color: #0066CC;
            }
            
            .popup-content p {
                margin: 0;
                font-size: 12px;
                color: #555;
            }
    </style>
    
    <div id='map' class='map'></div>

    <!-- load TomTom Maps Web SDK from CDN -->
    <link rel='stylesheet' type='text/css' href='https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.13.0/maps/maps.css'/>
    <script src='https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.13.0/maps/maps-web.min.js'></script>

    <script>
        // create the map
        tt.setProductInfo('TomTom Maps React Native Demo', '1.0');
        let map = tt.map({
            key: '${process.env.EXPO_PUBLIC_TOMTOM_API_KEY}',
            container: 'map',
            center: [-121.913, 37.361],
            zoom: 15,
            style: {
                map: 'basic_main',
                poi: 'poi_main',
                trafficIncidents: 'incidents_day'
            }
        });
        
        // Add map controls
        map.addControl(new tt.FullscreenControl());
        map.addControl(new tt.NavigationControl());
        
        // Make sure points of interest and buildings are visible
        map.on('load', function() {
            map.showTrafficFlow();
            
            // Make buildings and landmarks more visible
            map.setPaintProperty('POI', 'icon-opacity', 0.9);
            map.setPaintProperty('buildings', 'fill-opacity', 0.6);
            map.setPaintProperty('buildings', 'fill-extrusion-opacity', 0.6);
            
            // Show more road labels
            map.setLayoutProperty('road-shield', 'visibility', 'visible');
        });
        
        map.on('dragend', function() {
            let center = map.getCenter();
            window.ReactNativeWebView.postMessage(center.lng.toFixed(3) + ", " + center.lat.toFixed(3));
        });
    </script>
</div>
`;
