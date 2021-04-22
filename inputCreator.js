//Esta función la uso para poblar los inputs con valores aleatorios
const fs = require('fs');
const path = require('path');
const inputFolder = path.join(__dirname, './input');
const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

// Limito el valor entre 2 valores
Math.clamp = (value, min, max) => {
	if (value < min) return min;
	else if (value > max) return max;
  else return value;
};

// Interpolo o extrapolo entre 2 valores
Math.lerp = function (value1, value2, amount) {
	return value1 + (value2 - value1) * amount;
};

// Matriz de distancia entre puntos
const createDistanceMatrix = (def) => {

  const createSelfNode = () => {
    var result = {};
    var identity = {
      time: 0,
      distance: 0,
      maxHeight: 99,
      maxWeight: 999999999,
      toll: 0,
    }
    result["option_0"] = identity;
    return result;
  };

  const createMatrixNode = () => {
    var result = {};

    var alternatives = def.alternatives();
    if (alternatives === 0) alternatives++;

    for (let i = 0; i < alternatives; i++) {
      var alternative = {};
      alternative.time = def.duration(); //[ms]
      const avgVel = def.avgVel(); //[km/h]
      alternative.avgVel = avgVel;
      alternative.distance = avgVel * (alternative.time / (1000 * 60 * 60)); //[km]
      alternative.maxHeight = def.maxHeight(); //[m]
      alternative.maxWeight = def.maxWeight(); //[m]
      alternative.toll = def.toll(); //[$]
      result["option_" + i] = (alternative);
    };

    return result;
  };

  var result = {};

  //Creo una matriz vacia
  for (let i = 0; i < def.count; i++) {
    result[alphabet[i]] = {};
    for (let j = 0; j < def.count; j++) {
      result[alphabet[i]][alphabet[j]] = null;
    }
  }

  //Armo la matriz simétrica y con "0" en la diagonal
  for (let i = 0; i < def.count; i++) {
    for (let j = 0; j < def.count; j++) {
      if (j === i) result[alphabet[i]][alphabet[j]] = createSelfNode();
      else if (result[alphabet[j]][alphabet[i]] != null) result[alphabet[i]][alphabet[j]] = result[alphabet[j]][alphabet[i]];
      else result[alphabet[i]][alphabet[j]] = createMatrixNode();
    }
  }

  return result;
};

// Recursos de MB: vehículos y personal
const createResources = (def) => {
  var result = {};
  result.vehicles = [];

  for (let i = 0; i < def.buses.count; i++) {
    var bus = {};
    bus.licensePlate = "bus_" + alphabet[i];
    bus.capacity = Math.floor(Math.lerp(def.buses.capacity[0], def.buses.capacity[1], Math.random()));
    bus.year = Math.floor(Math.lerp(def.buses.year[0], def.buses.year[1], Math.random()));
    bus.wc = def.buses.WCPerc > Math.random() ? true : false;
    bus.type = "bus";
    bus.activationCost = Math.lerp(def.buses.activationCost[0], def.buses.activationCost[1], Math.random()),
    bus.costPerKm =  Math.lerp(def.buses.costPerKm[0], def.buses.costPerKm[1], Math.random()),
    bus.costPerHr =  Math.lerp(def.buses.costPerHr[0], def.buses.costPerHr[1], Math.random()),
    result.vehicles.push(bus);
  }


  for (let i = 0; i < def.transfers.count; i++) {
    var transfer = {};
    transfer.licensePlate = "transfer_" + alphabet[i];
    transfer.capacity = Math.floor(Math.lerp(def.transfers.capacity[0], def.transfers.capacity[1], Math.random()));
    transfer.year = Math.floor(Math.lerp(def.transfers.year[0], def.transfers.year[1], Math.random()));
    transfer.wc = def.transfers.WCPerc > Math.random() ? true : false;
    transfer.type = "transfer";
    transfer.activationCost = Math.lerp(def.transfers.activationCost[0], def.transfers.activationCost[1], Math.random()),
    transfer.costPerKm =  Math.lerp(def.transfers.costPerKm[0], def.transfers.costPerKm[1], Math.random()),
    transfer.costPerHr =  Math.lerp(def.transfers.costPerHr[0], def.transfers.costPerHr[1], Math.random()),
    result.vehicles.push(transfer);
  }

  return result;
};

// Servicios solicitados por los clientes
const createServices = (def) => {
  var result = [];
  for (let i = 0; i < def.count; i++) {
    var service = {};
    service.start = {};
    service.start.time = def.startTime + def.timeWindow * Math.random();
    service.capacity = Math.floor(Math.lerp(def.capacity[0], def.capacity[1], Math.random()));
    service.maxAge = Math.floor(Math.lerp(def.maxAge[0], def.maxAge[1], Math.random()));
    service.wc = (Math.random() < def.busesWCPerc) ? true : false;

    const startNodeName = alphabet[Math.floor(Math.random() * Object.keys(def.distMatrix).length)];
    const startNode = def.distMatrix[startNodeName];
    service.start.name = startNodeName;

    const endNodeName = alphabet[Math.floor(Math.random() * Object.keys(def.distMatrix).length)];
    const endNode = def.distMatrix[endNodeName];
    service.end = {};
    service.end.name = endNodeName;

    const distanceNode = startNode[endNodeName]["option_0"];
    service.duration = distanceNode.time;
    service.end.time = service.start.time + service.duration;
    service.distance = distanceNode.distance;
    
    service.types = ["any"],
    
    result.push(service);
  }
  // startTime: timeStamp(),
  // timeWindow: 1000 * 60 * 60 * 24, // 8hs es la ventana de tiempo de los servicios
  // distMatrix: distMatrix,
  // count: 10,
  // capacity: [10, 45],
  // busesWCPerc: 0.5,
  // types: ["any"],
  //   maxAge: [2008, 2020],
  return result;
};

//Paso como parametro las funciones de distribución para cada variable
const distMatrix = createDistanceMatrix({
  count: 8,
  alternatives: () => Math.floor(Math.sqrt(Math.random() * 10)),  // Puede haber hasta 3 rutas alternativas conectando los puntos
  duration: () => Math.floor(Math.random() * 1000 * 60 * 120),  // Distancias entre 0 y 2 horas [ms]
  avgVel: () => (Math.random() * 50) + 10, // Velocidad promedio entre 10 y 60 km/h [km/h]
  maxHeight: () => 3 + 6 * Math.cbrt(Math.random()), //Altura máxima [m]
  maxWeight: () => 7000 + 20000 * Math.cbrt(Math.random()), //Peso máximo [kg]
  toll: () => {
    if (Math.random() > 0.85) return 300; // 15% de chances de pasar por un peaje
    else return 0;
  }

});
fs.writeFileSync(path.join(inputFolder, './distanceMatrix.json'), JSON.stringify(distMatrix));

const resources = createResources({
  buses: {
    count: 3, //[unidades]
    capacity: [40, 60], //[pasajeros]
    year: [2008, 2021], //[año]
    WCPerc: 0.5, //[%prob]
    activationCost: [50, 80], //[$]
    costPerKm: [1, 2], //[$/km]
    costPerHr: [5,8] //[$/h]
  },
  transfers: {
    count: 3, //[unidades]
    capacity: [10, 20], //[pasajeros]
    year: [2008, 2021], //[año]
    WCPerc: 0, //[%prob]
    activationCost: [20, 25], //[$]
    costPerKm: [0.4, 0.8], //[$/km]
    costPerHr: [2,4]  //[$/h]
  }
});
fs.writeFileSync(path.join(inputFolder, './resources.json'), JSON.stringify(resources));

const services = createServices({
  startTime: Date.now(),
  timeWindow: 1000 * 60 * 60 * 24, // 8hs es la ventana de tiempo de los servicios [ms]
  distMatrix: distMatrix, 
  count: 5, // [unidades]
  capacity: [5, 30], // [pasajeros]
  busesWCPerc: 0.1, // [%prob]
  types: ["any"],
  maxAge: [5, 20], // [años]
});
fs.writeFileSync(path.join(inputFolder, './services.json'), JSON.stringify(services));