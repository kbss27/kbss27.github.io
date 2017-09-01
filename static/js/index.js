$(document).ready(function () {
	categoryDisplay();
	generateContent();
	backToTop();
});

function categoryDisplay() {
	$('.post-list-body>div[post-cate!=All]').hide();
	$('.categories-list-item').click(function () {
		var cate = $(this).attr('cate'); //get category's name
		$('.post-list-body>div[post-cate!=' + cate + ']').hide(250);
		$('.post-list-body>div[post-cate=' + cate + ']').show(400);
	});
}

function generateContent() {
	if (typeof $('#markdown-toc').html() === 'undefined') {
		$('#content').hide();
		$('#myArticle').removeClass('col-sm-9').addClass('col-sm-12');
	} else {
		$('#content .content-text').html('<ul>' + $('#markdown-toc').html() + '</ul>');
	}
}

function backToTop() {
	$(window).scroll(function () {
		if ($(window).scrollTop() > 100) {
			$("#top").fadeIn(500);
		} else {
			$("#top").fadeOut(500);
		}
	});
	$("#top").click(function () {
		$("body").animate({
			scrollTop: "0"
		}, 500);
	});
	$(function () {
		$('[data-toggle="tooltip"]').tooltip();
	});
}
