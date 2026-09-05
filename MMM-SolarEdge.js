Module.register("MMM-SolarEdge", {
  defaults: {
    updateInterval: 5 * 60 * 1000,
    animationSpeed: 1000,
    showSiteName: true,
    units: "kWh"
  },

  start() {
    this.data = {
      siteName: "",
      todayEnergy: null,
      currentPower: null,
      updatedAt: null,
      error: null
    };

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

    if (this.data.error) {
      const error = document.createElement("div");
      error.className = "solaredge-error";
      error.textContent = this.data.error;
      wrapper.appendChild(error);
      return wrapper;
    }

    const title = document.createElement("div");
    title.className = "solaredge-title";
    title.textContent = this.config.showSiteName && this.data.siteName
      ? this.data.siteName
      : "SolarEdge";
    wrapper.appendChild(title);

    const values = document.createElement("div");
    values.className = "solaredge-values";
    values.appendChild(this.createValue("Dnes", this.data.todayEnergy, "kWh"));
    values.appendChild(this.createValue("Teraz", this.data.currentPower, "W"));
    wrapper.appendChild(values);

    if (this.data.updatedAt) {
      const updated = document.createElement("div");
      updated.className = "solaredge-updated";
      updated.textContent = `Aktualizované ${this.data.updatedAt}`;
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
    if (notification !== "SOLAREDGE_DATA") {
      return;
    }

    this.data = payload;
    this.updateDom(this.config.animationSpeed);
  }
});