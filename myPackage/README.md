# Dandelion chart

> A new visualization approach for quantum states.


## Install
```cmd
npm install dandelion_chart -S
```

---

## Tutorial

#### We developed dandelion package to bridge the gap of quantum state visualization. Specifically, dandelion chart has three superior features which can be benificial for quantum computing users:

1. **Visualize the probability of each basic states, and visually reflect how amplitudes affect the corresponding probability.**
2. **Support the multi-qubit visualization, which is way better useful than Block Sphere.**
3. **Address the scalability issue introduced by a great number of basic states.**




## Parameters required:
* `state_vectors` *Array* : the state vector array to be visualized 
* `states` *Array* : titles of the state vector, e.g., ['010', ...]
* `bundle_g` *d3_selection* : the container for the dandelion chart
* `size_arr` *Array* : the size of the dandelion chart
* `position_arr` *Array* : positio of the dandelion chart
* `theta` *Number* : the parameters to decrease the area of circles, reducing the visual clutter when there are numerous basic states


## Usage example: 
```js
    let state_vector = [
        [0.13, 0.428],
        [0.07, -0.495],
        [0.1, 0.2],
        [0.4, 0.3]
    ]

    const states = [
        '00',
        '01',
        '10',
        '11',
    ]

    // Call dandelion_chart function below:
    dandelion_chart(state_vector, states, bundle_g, [300, 300], [0,0], 0.8)

```