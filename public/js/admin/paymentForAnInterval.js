let prevDate = document.querySelector('#prevDate');
let forwDate = document.querySelector('#forwDate');
console.log("YENİ");
function compare()
{
  if(prevDate.value > forwDate.value){
    alert("1.Tarih, 2.Tarihten küçük olmalıdır.");
    return false;
  }
  else if(prevDate.value == forwDate.value)
  {
    alert("Tarihler arasındaki fark çok az. Lütfen 2.Tarihi daha ileri bir tarih olarak işaretleyin.");
    return false;
  }
}
