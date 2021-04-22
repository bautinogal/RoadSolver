Optimizador de Recorridos:

1) (Opcional) Correr "inputCreator.js" para repoblar aleatoriamente los inputs en la carpeta "./input".
2) Correr "app.js" para calcular todas la alternativas para los inputs en la carpeta "./output".
3) Abrir el archivo "./output/result.json" para ver los resultados o correr "analyzeSolution.js" para obtener un analisis de los resultados (el archivo "result.json" puede ser muy grande)


Inputs: 
1) "DistanceMatrix": es la matriz que me dice la distancia en tiempo y kms entre los puntos, puede haber mas de una alternativa (por ejemplo: por autopista o por 2 rutas distintas).
2) "Resources": son los vehículos de la empresa y sus capacidades.
3) "Services": son los servicios solicitados por los clientes


Solver:
1) Calculo todas las formas en que puedo ordenar los vehículos.
2) Para cada una de estas formas a su vez calculo todas las formas de ordenar los servicios.
3) Calculo todos los servicios ordenados con el orden 2) que puedo hacer con el primer vehículo del orden 1).
4) Con lo que me sobra vuelvo al paso 1). 

*Los tiempos estan en ms
*Dimensiones Buses: https://www.dimensions.com/collection/buses#:~:text=Coach%20Buses%20have%20average%20lengths,these%20extended%20periods%20of%20travel.
*The curb weights for these transit buses currently range between approximately 20,000 and 33,000 pounds, and fully-loaded weights range from approximately 30,000 (13607kg) to 44,000 (19958kg) pounds. As such, passengers comprise roughly one- third of the gross vehicle weight (GVW) of a fully-loaded 40-ft transit bus.