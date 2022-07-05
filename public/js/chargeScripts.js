let sel = document.querySelector('#voltageType');
let ACDesc = document.querySelector('#ACDesc');
let ASDescLabel = document.querySelector('#ASDescLabel');

let cardNumber = document.querySelector('#cardNumber');
let expireMonth = document.querySelector('#expireMonth');
let expireYear = document.querySelector('#expireYear');
let cvv = document.querySelector('#cvv');


function loaded()
{
  ACDesc.style.visibility = "hidden";
  ACDescLabel.style.visibility = "hidden";
  DCDesc.style.visibility = "hidden";
  DCDescLabel.style.visibility = "hidden";

}

function handleChange()
{
  if(sel.value == 'AC')
  {
    ACDesc.setAttribute("required","");
    DCDesc.removeAttribute("required");
    ACDesc.style.visibility = "visible";
    ACDescLabel.style.visibility = "visible";
    DCDesc.style.visibility = "hidden";
    DCDescLabel.style.visibility = "hidden";
  }
  else if(sel.value == 'DC')
  {
    ACDesc.style.visibility = "hidden";
    ACDescLabel.style.visibility = "hidden";
    ACDesc.removeAttribute("required");
    DCDesc.setAttribute("required","");
    DCDesc.style.visibility = "visible";
    DCDescLabel.style.visibility = "visible";
  }
}

function resetCardInputs()
{
cardNumber.value = "";
expireMonth.selectedIndex = 0;
expireYear.selectedIndex = 0;
cvv.value="";

}


function fillCardInputs(cardNumberp, expireMonthp, expireYearp, cvvp)
{
  resetCardInputs();
  cardNumber.value = cardNumberp;
  expireMonth.value = expireMonthp;
  expireYear.value = expireYearp;
  cvv.value = cvvp;
}
