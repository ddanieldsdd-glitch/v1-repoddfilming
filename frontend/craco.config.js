// craco.config.js
const path = require("path");

try {
  require("dotenv").config();
} catch (e) {
  // dotenv no es crítico en todos los entornos; continuar si no está presente
}

const isDevServer = process.env.NODE_ENV !== "production";

const config = {
  enableHealthCheck: process.env.ENABLE_HEALTH_CHECK === "true",
};

let WebpackHealthPlugin;
let setupHealthEndpoints;
let healthPluginInstance;

try {
  if (config.enableHealthCheck) {
    WebpackHealthPlugin = require("./plugins/health-check/webpack-health-plugin");
    setupHealthEndpoints = require("./plugins/health-check/health-endpoints");
    healthPluginInstance = new WebpackHealthPlugin();
  }
} catch (e) {
  // Si los plugins no existen, no detener el build
  WebpackHealthPlugin = null;
  setupHealthEndpoints = null;
  healthPluginInstance = null;
}

module.exports = {
  // Desactivar ESLint durante el build para evitar fallos por loaders incompatibles
  eslint: {
    enable: false,
  },

  webpack: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },

    configure: (webpackConfig) => {
      // Reducir directorios observados para mejorar rendimiento en entornos Windows
      webpackConfig.watchOptions = {
        ...webpackConfig.watchOptions,
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/build/**",
          "**/dist/**",
          "**/coverage/**",
          "**/public/**",
        ],
      };

      // CSS principal no bloqueante: el hero usa estilos inline + critical-shell
      try {
        const HtmlWebpackPlugin = require("html-webpack-plugin");
        webpackConfig.plugins.forEach((plugin) => {
          if (plugin instanceof HtmlWebpackPlugin) {
            plugin.hooks.alterAssetTags.tap("DeferMainCss", (data) => {
              data.assetTags.styles = data.assetTags.styles.map((tag) => {
                if (
                  tag.tagName === "link" &&
                  tag.attributes.rel === "stylesheet" &&
                  String(tag.attributes.href || "").includes("/static/css/")
                ) {
                  return {
                    ...tag,
                    attributes: {
                      ...tag.attributes,
                      media: "print",
                      onload: "this.media='all'",
                    },
                  };
                }
                return tag;
              });
              return data;
            });
          }
        });
      } catch {
        // no bloquear el build si html-webpack-plugin no está disponible
      }

      // Añadir plugin de health check si está disponible y habilitado
      if (config.enableHealthCheck && healthPluginInstance && webpackConfig.plugins) {
        try {
          webpackConfig.plugins.push(healthPluginInstance);
        } catch (e) {
          // no bloquear el build si el push falla
        }
      }

      // Evitar inyectar o requerir módulos externos no controlados aquí
      return webpackConfig;
    },
  },

  // Opcional: exportar la configuración de devServer si se necesita
  devServer: (devServerConfig) => {
    if (config.enableHealthCheck && typeof setupHealthEndpoints === "function") {
      try {
        setupHealthEndpoints(devServerConfig);
      } catch (e) {
        // no bloquear si falla
      }
    }
    return devServerConfig;
  },
};
