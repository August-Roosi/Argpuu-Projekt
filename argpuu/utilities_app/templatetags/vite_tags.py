from django import template
import json
from django.conf import settings
from django.templatetags.static import static


"""Manifest file example:

{
  "index.html": {
    "css": [
      "assets/index-wrnCS-0b.css"
    ],
    "file": "assets/index--SvOC3kS.js",
    "isEntry": true,
    "src": "index.html"
  }
}


Selle hetkel tööle ei saanud aga eesmärk oleks see, et kui vite geneb static failid, siis ta saab otse mannifest failist teada, millise faili ta võtma peab
"""


register = template.Library()


@register.simple_tag
def static_from_manifest(asset_name):
    # Path to your manifest file (make sure it points to the correct location)
    manifest_path = settings.BASE_DIR / 'static/frontend/dist/manifest.json'

    try:
        # Open the manifest file and load its contents
        with open(manifest_path, 'r') as f:
            manifest = json.load(f)
        
        # Look up the asset name in the manifest
        print("hei")
        asset_path = None
        if asset_name == 'index.css':
            css_files = manifest.get('index.html', {}).get('css', [])
            asset_path = css_files[0] if css_files else ''  # Get the CSS file path
        elif asset_name == 'index.js':
            asset_path = manifest.get('index.html', {}).get('file', '')  # Get the JS file path

        # If no asset is found, raise an error
        if not asset_path:
            raise KeyError(f"Asset '{asset_name}' not found in manifest.")
        
        print(f"asset_path: {asset_path}")

        # Return the static path for Django to serve the file
        return static(f"frontend/dist/{asset_path}")

    except (FileNotFoundError, KeyError) as e:
        return f"Error: {e}"