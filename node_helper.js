const NodeHelper = require("node_helper");
const Log = require("logger");

module.exports = NodeHelper.create({
  start() {
    Log.info(`Starting node_helper for module: ${this.name}`);
    this.timer = null;
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "SOLAREDGE_CONFIG") {
      this.config = payload;
      this.fetchData();

      if (this.timer) {
        clearInterval(this.timer);
      }

      const updateInterval = Math.max(Number(payload.updateInterval) || 300000, 60000);
      this.timer = setInterval(() => {
        this.fetchData();
      }, updateInterval);
    }
  },

  async fetchData() {
    const { apiKey, siteId } = this.config || {};
    if (!apiKey || !siteId) {
      this.sendError("Chýba apiKey alebo siteId v konfigurácii.");
      return;
    }

    const url = `https://monitoringapi.solaredge.com/site/${encodeURIComponent(siteId)}/overview?api_key=${encodeURIComponent(apiKey)}`;

    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" }
      });

      if (!response.ok) {
        this.sendError(`SolarEdge API vrátilo HTTP ${response.status}: ${response.statusText}`);
        return;
      }

      const data = await response.json();
      const overview = data && data.overview;
      if (!overview) {
        this.sendError("Odpoveď neobsahuje dáta 'overview'.");
        return;
      }

      const todayEnergyWh = Number(overview.lastDayData && overview.lastDayData.energy);
      const currentPower = Number(overview.currentPower && overview.currentPower.power);

      this.sendSocketNotification("SOLAREDGE_DATA", {
        error: null,
        siteName: overview.name || "",
        todayEnergy: Number.isFinite(todayEnergyWh) ? (todayEnergyWh / 1000).toFixed(2) : null,
        currentPower: Number.isFinite(currentPower) ? Math.round(currentPower) : null,
        updatedAt: new Date().toLocaleTimeString("sk-SK", {
          hour: "2-digit",
          minute: "2-digit"
        })
      });
    } catch (error) {
      Log.error(`[MMM-SolarEdge] Error fetching data: ${error.message}`);
      this.sendError(`SolarEdge chyba: ${error.message}`);
    }
  },

  sendError(message) {
    Log.error(`[MMM-SolarEdge] ${message}`);
    this.sendSocketNotification("SOLAREDGE_DATA", {
      error: message,
      siteName: "Moja FVE",
      todayEnergy: null,
      currentPower: null,
      updatedAt: null
    });
  },

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
});