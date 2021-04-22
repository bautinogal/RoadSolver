const minToleranceBetweenTrips = 0; //[ms] Margen de seguridad para conectar recorridos (por si hay demoras)

const solver = async (input) => {

  const distanceMatrix = input.distanceMatrix;

  //Esto me devuelve toda las combinaciones posibles en las que puedo ordenar las keys de un objeto.
  const getAllOrderCombinations = (obj) => {

    const getPosibleOrders = (keys) => {
      var result = [];

      keys.forEach(key => {
        var localKeys = keys.map((x) => x);
        for (var i = 0; i < localKeys.length; i++)
          if (localKeys[i] === key) localKeys.splice(i, 1);

        var combinations = getPosibleOrders(localKeys)

        if (combinations.length > 0) {
          combinations.forEach(comb => {
            var res = [];
            res.push(key);
            comb.forEach(k => {
              res.push(k);
            });
            result.push(res);
          })
        } else {
          result.push([key]);
        }
      });

      return result;
    };

    var result = null;
    const keys = Object.keys(obj);
    result = getPosibleOrders(keys);
    return result;
  };

  //Esto me devuelve el costo en $ de la ruta
  const getRouteCost = (vehicle, services, origin = "a") => {

    const getConnectionCost = (vehicle, originName, endName) => {
      var result = 0;
      const costPerKm = vehicle.costPerKm;
      const costPerHr = vehicle.costPerHr;
      const distance = distanceMatrix[originName][endName]["option_0"].distance;
      const time = distanceMatrix[originName][endName]["option_0"].time;

      result = costPerKm * distance + costPerHr * (time / (1000 * 60 * 60));
      return result;
    };

    const getServiceCost = (vehicle, service) => {
      var result = 0;
      const costPerKm = vehicle.costPerKm;
      const costPerHr = vehicle.costPerHr;
      const distance = service.distance;
      const time = service.duration;

      result = costPerKm * distance + costPerHr * (time / (1000 * 60 * 60));
      return result;
    };

    var result = {};
    result.activation = 0;
    result.services = 0;
    result.connections = 0;
    result.total = 0;

    if (services.length > 0) {
      result.activation = vehicle.activationCost;
      result.connections += getConnectionCost(vehicle, origin, services[0].start.name);

      for (let i = 0; i < services.length - 1; i++) {
        result.services += getServiceCost(vehicle, services[i]);
        result.connections += getConnectionCost(vehicle, origin, services[0].start.name);
      }
      result.services += getServiceCost(vehicle, services[services.length - 1]);
      result.connections += getConnectionCost(vehicle, services[services.length - 1].end.name, origin);
    }

    result.total = result.activation + result.services + result.connections;

    return result;
  };

  // Devuelve todas las rutas posibles con el orden indicado
  const getPosibleRoutesByVehicleOrder = (vehicles, order, services) => {

    const getServicesAlternativesForVehicles = (vehicles, services) => {

      const getAlternative = (vehicle, services, serviceOrder) => {

        const tryAddService = (vehicle, servicePos, servicesDone) => {

          const canVehicleDoService = (vehicle, service) => {
            var result = true;
            if (vehicle.capacity < service.capacity) result = false;
            if (!vehicle.wc && service.wc) result = false;
            if (!service.types.includes(vehicle.type) && !service.types.includes('any')) result = false;
            return result;
          };

          // Devuelve la ruta mas barata que conecta esos puntos y puede hacer el vehículo
          // TODO: Revisar que acá no estoy considerando todas las alternativas: quizas me conviene una ruta que es mas cara porque me ahorra mas adelante.
          const getCheapestOption = (vehicle, distanceMatrixNode) => {
            return distanceMatrixNode["option_0"];
          };

          const overlapsWithOtherService = (servicesDone, service) => {
            var overlap = false;
            servicesDone.forEach(serviceDone => {
              if (servicesOverlap(serviceDone, service)) overlap = true;
            });
            return overlap;
          };

          //Me fijo si se pisa con un servicio que ya tengo en la lista
          const servicesOverlap = (serv1, serv2) => {
            if (serv1.start.time >= serv2.start.time && serv1.start.time <= serv2.end.time) return true;
            else if (serv1.end.time >= serv2.start.time && serv1.end.time <= serv2.end.time) return true;
            else return false;
          };

          const tryToInsertService = (servicesDone, pos, newService) => {
            var previous = null;
            var next = null;
            var posible = true;

            if (pos > 0) previous = servicesDone[pos - 1];
            if (pos < Object.keys(servicesDone).length) next = servicesDone[pos];

            if (previous != null)
              if (previous.end.time + input.distanceMatrix[previous.end.name][newService.start.name]["option_0"].time + minToleranceBetweenTrips > newService.start.time)
                posible = false;

            if (next != null)
              if (next.start.time < newService.end.time + input.distanceMatrix[next.start.name][newService.end.name]["option_0"].time + minToleranceBetweenTrips)
                posible = false;


            //A: Si entro acá es porque "servicesDone" esta vacio y solo puedo agregar en el lugar 0 del array
            if (previous === null && next === null) {
              if (pos != 0) throw "Error trying to insert service!";
            }

            if (posible) servicesDone.splice(pos, 0, newService);

            return servicesDone;
          };

          const service = services[servicePos];
          const canDoService = canVehicleDoService(vehicle, service);

          if (canDoService) {
            const overlap = overlapsWithOtherService(servicesDone, service);
            //Si no se pisa, veo si me da el tiempo para insertarlo entre el servicio anterior y siguiente
            if (!overlap) {
              const route = getCheapestOption(vehicle, distanceMatrix[service.start.name][service.end.name]);
              var i = 0;

              for (; i < Object.keys(servicesDone).length; i++)
                if (servicesDone[i].start.time > service.end.time) break;

              servicesDone = tryToInsertService(servicesDone, i, service);
            }
          }

          return servicesDone;
        };

        var result = {};
        result.time = {};
        result.time.start = Date.now();
        result.serviceOrder = serviceOrder;

        result.services = [];

        serviceOrder.forEach(servicePos => result.services = tryAddService(vehicle, servicePos, result.services));
        result.cost = getRouteCost(vehicle, result.services);

        const servicesLeft = services.filter(value => !result.services.includes(value));
        const vehiclesLeft = vehicles.map(x => x).splice(1, Object.keys(vehicles).length - 1);

        if (servicesLeft.length > 0 && vehiclesLeft.length > 0) {
          const orderLeft = order.map(x => x).splice(1, vehicles.length - 1);
          result.next = getPosibleRoutesByVehicleOrder(vehiclesLeft, orderLeft, servicesLeft);
        } else {
          result.end = {};
          if (servicesLeft.length === 0) result.end.status = "Complete"
          else if (vehiclesLeft.length === 0) result.end.status = "Out of vehicles";

          result.end.servicesLeft = servicesLeft;
          result.end.vehiclesLeft = vehiclesLeft;
        }

        result.time.end = Date.now();
        result.time.duration = result.time.end - result.time.start;
        return result;
      };

      var result = [];
      const vehicle = vehicles[0];
      const servicesOrders = getAllOrderCombinations(services);
      servicesOrders.forEach(serviceOrder => result.push(getAlternative(vehicle, services, serviceOrder)));


      return result;
    };

    var result = {};
    result.time = {};
    result.time.start = Date.now();
    result.vehicleOrder = order;

    result.vehicles = {};
    result.vehicles.actual = vehicles.map(x => x).splice(0, 1);
    result.vehicles.left = vehicles.map(x => x).splice(1, vehicles.length - 1);
    result.servicesLeft = services;
    result.servicesAlternatives = getServicesAlternativesForVehicles(vehicles, services);

    result.time.end = Date.now();
    result.time.duration = result.time.end - result.time.start;
    return result;
  };

  const getPosibleRoutesBranches = (posibilitiesTree) => {

    const getServicesAlternativesBranches = (serviceAlternatives) => {

      const addCosts = (cost1, cost2) => {
        return {
          total: cost1.total + cost2.total,
          services: cost1.services + cost2.services,
          connections: cost1.connections + cost2.connections,
          activation: cost1.activation + cost2.activation,
        }

      };

      var result = [];
      serviceAlternatives.forEach(serviceAlternative => {
        const serviceOrder = serviceAlternative.serviceOrder;
        const cost = serviceAlternative.cost;

        if (serviceAlternative.next) {
          const nextBranches = getPosibleRoutesBranches([serviceAlternative.next]);
          nextBranches.forEach(branch => {
            branch.treePath.unshift({ serviceOrder: serviceOrder });
            branch.cost = addCosts(cost, branch.cost);
            result.push(branch);
          });
        } else if(serviceAlternative.end){
          var branch = {};
          branch.treePath = [];
          branch.treePath.unshift({ serviceOrder: serviceOrder });
          branch.cost = cost;
          branch.status = serviceAlternative.status;
          branch.servicesLeft = serviceAlternative.servicesLeft;
          branch.vehiclesLeft = serviceAlternative.vehiclesLeft;
          result.push(branch);
        } else {
          throw "Invalid branch (should have next or end node)!";
        }

      });

      return result;
    };

    const example = {
      treePath: [{ vehicleOrder: [1, 3, 4] }, { serviceOrder: [1, 3, 4] }],
      status: "Out of Vehicles",
      vehicles: {
        used: [
          {
            vehicle: {},
            services: [{}, {}],
            distance: {
              total: 32,
              services: 20,
              connections: 12
            },
            time: {
              total: 32,
              services: 20,
              connections: 12
            },
            cost: {
              total: 32,
              services: 20,
              connections: 12
            }
          }
        ],
        left: [{ vehicle: {} }]
      },
      services: {
        done: [{}, {}],
        left: [{}]
      },
      cost: {
        total: 232.123,
        services: 23,
        connections: 209.123,
      }

    }

    var result = [];
    posibilitiesTree.forEach(vehicleOrder => {
      const servicesBranches = getServicesAlternativesBranches(vehicleOrder.servicesAlternatives);

      servicesBranches.forEach(serviceBranche => {
        serviceBranche.treePath.unshift({ vehicleOrder: vehicleOrder.vehicleOrder });
        result.push(serviceBranche);
      });
    });

    return result;
  };

  var result = {};
  result.time = {};
  result.time.start = Date.now();

  const posibleVehiclesOrders = getAllOrderCombinations(input.resources.vehicles);
  result.posibleRoutesTree = [];

  console.log(`Building alternatives tree...`);

  var i = 1;
  posibleVehiclesOrders.forEach(order => {
    console.log(`Calculating vehicle order: ${order.join()} (${i} of ${posibleVehiclesOrders.length})`);
    result.posibleRoutesTree.push(getPosibleRoutesByVehicleOrder(input.resources.vehicles, order, input.services));
    i++;
  });

  console.log(`Building branches list from alternatives tree...`);
  result.posibleRoutesBranches = getPosibleRoutesBranches(result.posibleRoutesTree);
  console.log(`Branches Count: ${result.posibleRoutesBranches.length}`);

  result.time.end = Date.now();
  result.time.duration = result.time.end - result.time.start;

  return result;
};


module.exports = solver;