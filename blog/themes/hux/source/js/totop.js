$(window).scroll(function() {
	if (document.body.clientWidth < 1100)
		return;
    $(window).scrollTop() > $(window).height()*0.5 ? $("#rocket").addClass("show") : $("#rocket").removeClass("show");
});

$("#rocket").click(function() {
    // $("#rocket").addClass("launch");
    $("html, body").animate({
        scrollTop: 0
    }, 1000);
    // , function() {
        // $("#rocket").removeClass("show launch");
    // });
    return false;
});