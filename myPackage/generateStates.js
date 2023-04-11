function generateStates(n){
    var states = [];

    // Convert to decimal
    var maxDecimal = parseInt("1".repeat(n),2);

    // For every number between 0->decimal
    for(var i = 0; i <= maxDecimal; i++){
        // Convert to binary, pad with 0, and add to final results
        states.push(i.toString(2).padStart(n,'0'));
    }

    return states;
}


export default generateStates;