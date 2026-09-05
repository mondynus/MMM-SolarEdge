const NodeHelper = require("node_helper");
const https = require("https");

module.exports = NodeHelper.create({
  start() {
    this.timer = null;
  },

  socketNotificationReceived(notification, config) {
    if (notification !== "SOLAREDGE_CONFIG") {
      return;
    }

    this.config = config;
    this.fetchData();

    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = setInterval(
      () => this.fetchData(),
      Math.max(Number(config.updateInterval) || 300000, 60000)
    );
  },

  fetchData() {
    const { apiKey, siteId } = this.config || {};
    if (!apiKey || !siteId) {
      this.sendSocketNotification("SOLAREDGE_DATA", {
        error: "Chýba apiKey alebo siteId v konfigurácii.",
        siteName: "",
        todayEnergy: null,
        currentPower: null,
        updatedAt: null
      });
      return;
    }

    const query = new URLSearchParams({
      api_key: String(apiKey),
      startTime: this.localStartOfDay(),
      endTime: this.localEndOfDay()
    });
    const url = `https://monitoringapi.solaredge.com/site/${encodeURIComponent(siteId)}/overview?${query}`;

    https.get(url, { headers: { Accept: "application/json" } }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => this.handleResponse(response.statusCode, body));
    }).on("error", (error) => this.sendError(`SolarEdge: ${error.message}`));
  },

  handleResponse(statusCode, body) {
    if (statusCode !== 200) {
      this.sendError(`SolarEdge API vrátilo HTTP ${statusCode}.`);
      return;
    }

    try {
      const response = JSON.parse(body);
      const overview = response.overview;
      if (!overview) {
        throw new Error("Odpoveď neobsahuje overview.");
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
      this.sendError(`SolarEdge dáta sa nedajú spracovať: ${error.message}`);
    }
  },

  sendError(message) {
    this.sendSocketNotification("SOLAREDGE_DATA", {
      error: message,
      siteName: "SolarEdge",
      todayEnergy: null,
      currentPower: null,
      updatedAt: null
    });
  },

  localStartOfDay() {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return this.formatDate(date);
  },

  localEndOfDay() {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return this.formatDate(date);
  },

  formatDate(date) {
    const pad = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }
});