const {
  withProjectBuildGradle,
  withSettingsGradle,
} = require("@expo/config-plugins");

const MAPBOX_REPO_URL = "https://api.mapbox.com/downloads/v2/releases/maven";

function ensureMapboxRepoInSettingsGradle(contents) {
  if (contents.includes(MAPBOX_REPO_URL)) return contents;

  const dmIndex = contents.indexOf("dependencyResolutionManagement");
  if (dmIndex === -1) return contents;

  const reposIndex = contents.indexOf("repositories {", dmIndex);
  if (reposIndex === -1) return contents;

  const insertPos = contents.indexOf("\n", reposIndex);
  if (insertPos === -1) return contents;

  const block = [
    "",
    "    // Mapbox Maven (requires downloads token: sk...)",
    "    maven {",
    `      url "${MAPBOX_REPO_URL}"`,
    "      authentication { basic(org.gradle.authentication.http.BasicAuthentication) }",
    "      credentials {",
    '        username = "mapbox"',
    "        def mapboxDownloadsToken = (System.getenv(\"MAPBOX_DOWNLOADS_TOKEN\")",
    "          ?: System.getenv(\"MAPBOX_DOWNLOAD_TOKEN\")",
    "          ?: System.getenv(\"RNMAPBOX_MAPS_DOWNLOAD_TOKEN\")",
    "          ?: \"\").trim()",
    "        if (!mapboxDownloadsToken) {",
    "          println(\"WARNING: Mapbox downloads token is not set (MAPBOX_DOWNLOADS_TOKEN / MAPBOX_DOWNLOAD_TOKEN / RNMAPBOX_MAPS_DOWNLOAD_TOKEN).\")",
    "        }",
    "        password = mapboxDownloadsToken",
    "      }",
    "    }",
    "",
  ].join("\n");

  return contents.slice(0, insertPos + 1) + block + contents.slice(insertPos + 1);
}

function ensureMapboxRepoInProjectBuildGradle(contents) {
  if (contents.includes(MAPBOX_REPO_URL)) return contents;

  const allProjectsIndex = contents.indexOf("allprojects");
  if (allProjectsIndex === -1) return contents;

  const reposIndex = contents.indexOf("repositories {", allProjectsIndex);
  if (reposIndex === -1) return contents;

  const insertPos = contents.indexOf("\n", reposIndex);
  if (insertPos === -1) return contents;

  const block = [
    "",
    "        // Mapbox Maven (requires downloads token: sk...)",
    "        maven {",
    `            url '${MAPBOX_REPO_URL}'`,
    "            authentication {",
    "                basic(org.gradle.authentication.http.BasicAuthentication)",
    "            }",
    "            credentials {",
    "                username = 'mapbox'",
    "                def mapboxDownloadsToken = (System.getenv('MAPBOX_DOWNLOADS_TOKEN')",
    "                        ?: System.getenv('MAPBOX_DOWNLOAD_TOKEN')",
    "                        ?: System.getenv('RNMAPBOX_MAPS_DOWNLOAD_TOKEN')",
    "                        ?: '').trim()",
    "                if (!mapboxDownloadsToken) {",
    "                    println(\"WARNING: Mapbox downloads token is not set (MAPBOX_DOWNLOADS_TOKEN / MAPBOX_DOWNLOAD_TOKEN / RNMAPBOX_MAPS_DOWNLOAD_TOKEN).\")",
    "                }",
    "                password = mapboxDownloadsToken",
    "            }",
    "        }",
    "",
  ].join("\n");

  return contents.slice(0, insertPos + 1) + block + contents.slice(insertPos + 1);
}

module.exports = function withMapboxMaven(config) {
  config = withSettingsGradle(config, (config) => {
    config.modResults.contents = ensureMapboxRepoInSettingsGradle(
      config.modResults.contents
    );
    return config;
  });

  config = withProjectBuildGradle(config, (config) => {
    config.modResults.contents = ensureMapboxRepoInProjectBuildGradle(
      config.modResults.contents
    );
    return config;
  });

  return config;
};
