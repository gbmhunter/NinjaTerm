NinjaTerm performance is quite slow when 1kB/s or so of data is being received. This is especially slow when it is also graphing. 

I have installed React dev tools and have selected the "Highlight updates when components render" option. This shows that almost all of app is redrawing whenever data is received, which shouldn't be the case.

Read the information here: https://mobx.js.org/react-optimizations.html titled "Optimizing React component rendering". This might have some useful advice relating to the problem.

There is a "performance testing" mode that can be run by clicking a button from the general settings view. This is a good way of getting a baseline and then seeing if any changes improve the performance.

How should I improve the performance?

Make sure the unit tests are passing are doing any changes with "npm run test:unit".
