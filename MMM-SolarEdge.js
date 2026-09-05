Module.register("MMM-SolarEdge", {
  requiresVersion: "2.29.0",

  defaults: {
    apiKey: "",
    siteId: "",
    updateInterval: 5 * 60 * 1000,
    animationSpeed: 1000,
    showSiteName: true,
    units: "kWh"
  },

  start() {
    this.solarData = {
      siteName: "",
      todayEnergy: null,
      currentPower: null,
      updatedAt: null,
      error: null
    };
    this.loaded = false;

    this.sendSocketNotification("SOLAREDGE_CONFIG", {
      apiKey: this.config.apiKey,
      siteId: this.config.siteId,
      updateInterval: this.config.updateInterval
    });
  },

  getStyles() {
    return ["MMM-SolarEdge.css"];
  },

  getDom() {
    const wrapper = document.createElement("div");
    wrapper.className = "solaredge-wrapper";

    if (!this.loaded && !this.solarData.error) {
      wrapper.innerHTML = "Nahrávam...";
      wrapper.className = "dimmed light small";
      return wrapper;
    }

    if (this.solarData.error) {
      const error = document.createElement("div");
      error.className = "solaredge-error";
      error.textContent = this.solarData.error;
      wrapper.appendChild(error);
      return wrapper;
    }

    const title = document.createElement("div");
    title.className = "solaredge-title";
    title.textContent = this.config.showSiteName && this.solarData.siteName
      ? this.solarData.siteName
      : "SolarEdge";
    wrapper.appendChild(title);

    const values = document.createElement("div");
    values.className = "solaredge-values";
    values.appendChild(this.createValue("Dnes", this.solarData.todayEnergy, "kWh"));
    values.appendChild(this.createValue("Teraz", this.solarData.currentPower, "W"));
    wrapper.appendChild(values);

    if (this.solarData.updatedAt) {
      const updated = document.createElement("div");
      updated.className = "solaredge-updated";
      updated.textContent = `Aktualizované ${this.solarData.updatedAt}`;
      wrapper.appendChild(updated);
    }

    return wrapper;
  },

  createValue(label, value, unit) {
    const element = document.createElement("div");
    element.className = "solaredge-value";

    const labelElement = document.createElement("span");
    labelElement.className = "solaredge-label";
    labelElement.textContent = label;

    const valueElement = document.createElement("span");
    valueElement.className = "solaredge-number";
    valueElement.textContent = value === null ? "--" : `${value} ${unit}`;

    element.appendChild(labelElement);
    element.appendChild(valueElement);
    return element;
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "SOLAREDGE_DATA") {
      this.solarData = payload;
      this.loaded = true;
      this.updateDom(this.config.animationSpeed);
    }
  }
});