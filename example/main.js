
window.onload = () => {
    let dial = document.querySelector("ui-dial");
    let label = document.querySelector("#value");

    dial.addEventListener("change",(e)=>{
        console.log("change",e.target.value);
    })

    dial.addEventListener("input",(e)=>{
        label.innerText = e.target.value ;
    })

    console.log("Events added")
}

function update(){
    let dial = document.querySelector("ui-dial");
    dial.value += 1 ;
}