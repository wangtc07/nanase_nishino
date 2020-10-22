function FJInsertIcon(mt_icon_base, position) {
    var mt_icons = [
        [ "sun.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/sun.gif*/, "sun", 16, 16 ],
        [ "cloud.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/cloud.gif*/, "cloud", 16, 16 ],
        [ "rain.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/rain.gif*/, "rain", 16, 16 ],
        [ "snow.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/snow.gif*/, "snow", 16, 16 ],
        [ "thunder.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/thunder.gif*/, "thunder", 16, 16 ],
        [ "typhoon.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/typhoon.gif*/, "typhoon", 16, 16 ],
        [ "mist.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/mist.gif*/, "mist", 16, 16 ],
        [ "sprinkle.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/sprinkle.gif*/, "sprinkle", 16, 16 ],
        [ "aries.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/aries.gif*/, "aries", 16, 16 ],
        [ "taurus.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/taurus.gif*/, "taurus", 16, 16 ],
        [ "gemini.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/gemini.gif*/, "gemini", 16, 16 ],
        [ "cancer.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/cancer.gif*/, "cancer", 16, 16 ],
        [ "leo.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/leo.gif*/, "leo", 16, 16 ],
        [ "virgo.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/virgo.gif*/, "virgo", 16, 16 ],
        [ "libra.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/libra.gif*/, "libra", 16, 16 ],
        [ "scorpius.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/scorpius.gif*/, "scorpius", 16, 16 ],
        [ "sagittarius.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/sagittarius.gif*/, "sagittarius", 16, 16 ],
        [ "capricornus.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/capricornus.gif*/, "capricornus", 16, 16 ],
        [ "aquarius.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/aquarius.gif*/, "aquarius", 16, 16 ],
        [ "pisces.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/pisces.gif*/, "pisces", 16, 16 ],
        [ "sports.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/sports.gif*/, "sports", 16, 16 ],
        [ "baseball.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/baseball.gif*/, "baseball", 16, 16 ],
        [ "golf.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/golf.gif*/, "golf", 16, 16 ],
        [ "tennis.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/tennis.gif*/, "tennis", 16, 16 ],
        [ "soccer.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/soccer.gif*/, "soccer", 16, 16 ],
        [ "ski.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/ski.gif*/, "ski", 16, 16 ],
        [ "basketball.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/basketball.gif*/, "basketball", 16, 16 ],
        [ "motorsports.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/motorsports.gif*/, "motorsports", 16, 16 ],
        [ "pocketbell.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/pocketbell.gif*/, "pocketbell", 16, 16 ],
        [ "train.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/train.gif*/, "train", 16, 16 ],
        [ "subway.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/subway.gif*/, "subway", 16, 16 ],
        [ "bullettrain.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/bullettrain.gif*/, "bullettrain", 16, 16 ],
        [ "car.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/car.gif*/, "car", 16, 16 ],
        [ "rvcar.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/rvcar.gif*/, "rvcar", 16, 16 ],
        [ "bus.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/bus.gif*/, "bus", 16, 16 ],
        [ "ship.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/ship.gif*/, "ship", 16, 16 ],
        [ "airplane.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/airplane.gif*/, "airplane", 16, 16 ],
        [ "house.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/house.gif*/, "house", 16, 16 ],
        [ "building.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/building.gif*/, "building", 16, 16 ],
        [ "postoffice.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/postoffice.gif*/, "postoffice", 16, 16 ],
        [ "hospital.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/hospital.gif*/, "hospital", 16, 16 ],
        [ "bank.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/bank.gif*/, "bank", 16, 16 ],
        [ "atm.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/atm.gif*/, "atm", 16, 16 ],
        [ "hotel.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/hotel.gif*/, "hotel", 16, 16 ],
        [ "24hours.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/24hours.gif*/, "24hours", 16, 16 ],
        [ "gasstation.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/gasstation.gif*/, "gasstation", 16, 16 ],
        [ "parking.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/parking.gif*/, "parking", 16, 16 ],
        [ "signaler.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/signaler.gif*/, "signaler", 16, 16 ],
        [ "toilet.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/toilet.gif*/, "toilet", 16, 16 ],
        [ "restaurant.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/restaurant.gif*/, "restaurant", 16, 16 ],
        [ "cafe.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/cafe.gif*/, "cafe", 16, 16 ],
        [ "bar.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/bar.gif*/, "bar", 16, 16 ],
        [ "beer.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/beer.gif*/, "beer", 16, 16 ],
        [ "fastfood.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/fastfood.gif*/, "fastfood", 16, 16 ],
        [ "boutique.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/boutique.gif*/, "boutique", 16, 16 ],
        [ "hairsalon.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/hairsalon.gif*/, "hairsalon", 16, 16 ],
        [ "karaoke.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/karaoke.gif*/, "karaoke", 16, 16 ],
        [ "movie.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/movie.gif*/, "movie", 16, 16 ],
        [ "upwardright.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/upwardright.gif*/, "upwardright", 16, 16 ],
        [ "carouselpony.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/carouselpony.gif*/, "carouselpony", 16, 16 ],
        [ "music.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/music.gif*/, "music", 16, 16 ],
        [ "art.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/art.gif*/, "art", 16, 16 ],
        [ "drama.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/drama.gif*/, "drama", 16, 16 ],
        [ "event.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/event.gif*/, "event", 16, 16 ],
        [ "ticket.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/ticket.gif*/, "ticket", 16, 16 ],
        [ "smoking.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/smoking.gif*/, "smoking", 16, 16 ],
        [ "nosmoking.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/nosmoking.gif*/, "nosmoking", 16, 16 ],
        [ "camera.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/camera.gif*/, "camera", 16, 16 ],
        [ "bag.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/bag.gif*/, "bag", 16, 16 ],
        [ "book.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/book.gif*/, "book", 16, 16 ],
        [ "ribbon.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/ribbon.gif*/, "ribbon", 16, 16 ],
        [ "present.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/present.gif*/, "present", 16, 16 ],
        [ "birthday.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/birthday.gif*/, "birthday", 16, 16 ],
        [ "telephone.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/telephone.gif*/, "telephone", 16, 16 ],
        [ "mobilephone.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/mobilephone.gif*/, "mobilephone", 16, 16 ],
        [ "memo.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/memo.gif*/, "memo", 16, 16 ],
        [ "tv.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/tv.gif*/, "tv", 16, 16 ],
        [ "game.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/game.gif*/, "game", 16, 16 ],
        [ "cd.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/cd.gif*/, "cd", 16, 16 ],
        [ "heart.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/heart.gif*/, "heart", 16, 16 ],
        [ "spade.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/spade.gif*/, "spade", 16, 16 ],
        [ "diamond.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/diamond.gif*/, "diamond", 16, 16 ],
        [ "club.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/club.gif*/, "club", 16, 16 ],
        [ "eye.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/eye.gif*/, "eye", 16, 16 ],
        [ "ear.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/ear.gif*/, "ear", 16, 16 ],
        [ "rock.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/rock.gif*/, "rock", 16, 16 ],
        [ "scissors.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/scissors.gif*/, "scissors", 16, 16 ],
        [ "paper.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/paper.gif*/, "paper", 16, 16 ],
        [ "downwardright.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/downwardright.gif*/, "downwardright", 16, 16 ],
        [ "upwardleft.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/upwardleft.gif*/, "upwardleft", 16, 16 ],
        [ "foot.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/foot.gif*/, "foot", 16, 16 ],
        [ "shoe.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/shoe.gif*/, "shoe", 16, 16 ],
        [ "eyeglass.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/eyeglass.gif*/, "eyeglass", 16, 16 ],
        [ "wheelchair.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/wheelchair.gif*/, "wheelchair", 16, 16 ],
        [ "newmoon.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/newmoon.gif*/, "newmoon", 16, 16 ],
        [ "moon1.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/moon1.gif*/, "moon1", 16, 16 ],
        [ "moon2.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/moon2.gif*/, "moon2", 16, 16 ],
        [ "moon3.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/moon3.gif*/, "moon3", 16, 16 ],
        [ "fullmoon.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/fullmoon.gif*/, "fullmoon", 16, 16 ],
        [ "dog.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/dog.gif*/, "dog", 16, 16 ],
        [ "cat.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/cat.gif*/, "cat", 16, 16 ],
        [ "yacht.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/yacht.gif*/, "yacht", 16, 16 ],
        [ "xmas.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/xmas.gif*/, "xmas", 16, 16 ],
        [ "downwardleft.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/downwardleft.gif*/, "downwardleft", 16, 16 ],
        [ "phoneto.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/phoneto.gif*/, "phoneto", 16, 16 ],
        [ "mailto.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/mailto.gif*/, "mailto", 16, 16 ],
        [ "faxto.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/faxto.gif*/, "faxto", 16, 16 ],
        [ "info01.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/info01.gif*/, "info01", 16, 16 ],
        [ "info02.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/info02.gif*/, "info02", 16, 16 ],
        [ "mail.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/mail.gif*/, "mail", 16, 16 ],
        [ "by-d.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/by-d.gif*/, "by-d", 16, 16 ],
        [ "d-point.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/d-point.gif*/, "d-point", 16, 16 ],
        [ "yen.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/yen.gif*/, "yen", 16, 16 ],
        [ "free.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/free.gif*/, "free", 16, 16 ],
        [ "id.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/id.gif*/, "id", 16, 16 ],
        [ "key.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/key.gif*/, "key", 16, 16 ],
        [ "enter.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/enter.gif*/, "enter", 16, 16 ],
        [ "clear.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/clear.gif*/, "clear", 16, 16 ],
        [ "search.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/search.gif*/, "search", 16, 16 ],
        [ "new.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/new.gif*/, "new", 16, 16 ],
        [ "flag.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/flag.gif*/, "flag", 16, 16 ],
        [ "freedial.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/freedial.gif*/, "freedial", 16, 16 ],
        [ "sharp.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/sharp.gif*/, "sharp", 16, 16 ],
        [ "mobaq.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/mobaq.gif*/, "mobaq", 16, 16 ],
        [ "one.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/one.gif*/, "one", 16, 16 ],
        [ "two.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/two.gif*/, "two", 16, 16 ],
        [ "three.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/three.gif*/, "three", 16, 16 ],
        [ "four.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/four.gif*/, "four", 16, 16 ],
        [ "five.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/five.gif*/, "five", 16, 16 ],
        [ "six.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/six.gif*/, "six", 16, 16 ],
        [ "seven.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/seven.gif*/, "seven", 16, 16 ],
        [ "eight.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/eight.gif*/, "eight", 16, 16 ],
        [ "nine.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/nine.gif*/, "nine", 16, 16 ],
        [ "zero.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/zero.gif*/, "zero", 16, 16 ],
        [ "ok.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/ok.gif*/, "ok", 16, 16 ],
        [ "heart01.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/heart01.gif*/, "heart01", 16, 16 ],
        [ "heart02.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/heart02.gif*/, "heart02", 16, 16 ],
        [ "heart03.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/heart03.gif*/, "heart03", 16, 16 ],
        [ "heart04.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/heart04.gif*/, "heart04", 16, 16 ],
        [ "happy01.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/happy01.gif*/, "happy01", 16, 16 ],
        [ "angry.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/angry.gif*/, "angry", 16, 16 ],
        [ "despair.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/despair.gif*/, "despair", 16, 16 ],
        [ "sad.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/sad.gif*/, "sad", 16, 16 ],
        [ "wobbly.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/wobbly.gif*/, "wobbly", 16, 16 ],
        [ "up.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/up.gif*/, "up", 16, 16 ],
        [ "note.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/note.gif*/, "note", 16, 16 ],
        [ "spa.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/spa.gif*/, "spa", 16, 16 ],
        [ "cute.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/cute.gif*/, "cute", 16, 16 ],
        [ "kissmark.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/kissmark.gif*/, "kissmark", 16, 16 ],
        [ "shine.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/shine.gif*/, "shine", 16, 16 ],
        [ "flair.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/flair.gif*/, "flair", 16, 16 ],
        [ "annoy.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/annoy.gif*/, "annoy", 16, 16 ],
        [ "punch.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/punch.gif*/, "punch", 16, 16 ],
        [ "bomb.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/bomb.gif*/, "bomb", 16, 16 ],
        [ "notes.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/notes.gif*/, "notes", 16, 16 ],
        [ "down.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/down.gif*/, "down", 16, 16 ],
        [ "sleepy.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/sleepy.gif*/, "sleepy", 16, 16 ],
        [ "sign01.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/sign01.gif*/, "sign01", 16, 16 ],
        [ "sign02.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/sign02.gif*/, "sign02", 16, 16 ],
        [ "sign03.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/sign03.gif*/, "sign03", 16, 16 ],
        [ "impact.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/impact.gif*/, "impact", 16, 16 ],
        [ "sweat01.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/sweat01.gif*/, "sweat01", 16, 16 ],
        [ "sweat02.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/sweat02.gif*/, "sweat02", 16, 16 ],
        [ "dash.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/dash.gif*/, "dash", 16, 16 ],
        [ "sign04.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/sign04.gif*/, "sign04", 16, 16 ],
        [ "sign05.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/sign05.gif*/, "sign05", 16, 16 ],
        [ "slate.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/slate.gif*/, "slate", 16, 16 ],
        [ "pouch.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/pouch.gif*/, "pouch", 16, 16 ],
        [ "pen.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/pen.gif*/, "pen", 16, 16 ],
        [ "shadow.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/shadow.gif*/, "shadow", 16, 16 ],
        [ "chair.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/chair.gif*/, "chair", 16, 16 ],
        [ "night.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/night.gif*/, "night", 16, 16 ],
        [ "soon.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/soon.gif*/, "soon", 16, 16 ],
        [ "on.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/on.gif*/, "on", 16, 16 ],
        [ "end.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/end.gif*/, "end", 16, 16 ],
        [ "clock.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/clock.gif*/, "clock", 16, 16 ],
        [ "appli01.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/appli01.gif*/, "appli01", 16, 16 ],
        [ "appli02.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/appli02.gif*/, "appli02", 16, 16 ],
        [ "t-shirt.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/t-shirt.gif*/, "t-shirt", 16, 16 ],
        [ "moneybag.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/moneybag.gif*/, "moneybag", 16, 16 ],
        [ "rouge.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/rouge.gif*/, "rouge", 16, 16 ],
        [ "denim.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/denim.gif*/, "denim", 16, 16 ],
        [ "snowboard.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/snowboard.gif*/, "snowboard", 16, 16 ],
        [ "bell.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/bell.gif*/, "bell", 16, 16 ],
        [ "door.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/door.gif*/, "door", 16, 16 ],
        [ "dollar.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/dollar.gif*/, "dollar", 16, 16 ],
        [ "pc.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/pc.gif*/, "pc", 16, 16 ],
        [ "loveletter.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/loveletter.gif*/, "loveletter", 16, 16 ],
        [ "wrench.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/wrench.gif*/, "wrench", 16, 16 ],
        [ "pencil.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/pencil.gif*/, "pencil", 16, 16 ],
        [ "crown.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/crown.gif*/, "crown", 16, 16 ],
        [ "ring.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/ring.gif*/, "ring", 16, 16 ],
        [ "sandclock.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/sandclock.gif*/, "sandclock", 16, 16 ],
        [ "bicycle.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/bicycle.gif*/, "bicycle", 16, 16 ],
        [ "japanesetea.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/japanesetea.gif*/, "japanesetea", 16, 16 ],
        [ "watch.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/watch.gif*/, "watch", 16, 16 ],
        [ "think.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/think.gif*/, "think", 16, 16 ],
        [ "confident.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/confident.gif*/, "confident", 16, 16 ],
        [ "coldsweats01.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/coldsweats01.gif*/, "coldsweats01", 16, 16 ],
        [ "coldsweats02.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/coldsweats02.gif*/, "coldsweats02", 16, 16 ],
        [ "pout.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/pout.gif*/, "pout", 16, 16 ],
        [ "gawk.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/gawk.gif*/, "gawk", 16, 16 ],
        [ "lovely.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/lovely.gif*/, "lovely", 16, 16 ],
        [ "good.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/good.gif*/, "good", 16, 16 ],
        [ "bleah.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/bleah.gif*/, "bleah", 16, 16 ],
        [ "wink.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/wink.gif*/, "wink", 16, 16 ],
        [ "happy02.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/happy02.gif*/, "happy02", 16, 16 ],
        [ "bearing.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/bearing.gif*/, "bearing", 16, 16 ],
        [ "catface.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/catface.gif*/, "catface", 16, 16 ],
        [ "crying.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/crying.gif*/, "crying", 16, 16 ],
        [ "weep.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/weep.gif*/, "weep", 16, 16 ],
        [ "ng.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/ng.gif*/, "ng", 16, 16 ],
        [ "clip.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/clip.gif*/, "clip", 16, 16 ],
        [ "copyright-1.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/copyright.gif*/, "copyright", 16, 16 ],
        [ "tm.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/tm.gif*/, "tm", 16, 16 ],
        [ "run.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/run.gif*/, "run", 16, 16 ],
        [ "secret.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/secret.gif*/, "secret", 16, 16 ],
        [ "recycle.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/recycle.gif*/, "recycle", 16, 16 ],
        [ "r-mark.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/r-mark.gif*/, "r-mark", 16, 16 ],
        [ "danger.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/danger.gif*/, "danger", 16, 16 ],
        [ "ban.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/ban.gif*/, "ban", 16, 16 ],
        [ "empty.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/empty.gif*/, "empty", 16, 16 ],
        [ "pass.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/pass.gif*/, "pass", 16, 16 ],
        [ "full.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/full.gif*/, "full", 16, 16 ],
        [ "leftright.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/leftright.gif*/, "leftright", 16, 16 ],
        [ "updown.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/updown.gif*/, "updown", 16, 16 ],
        [ "school.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/school.gif*/, "school", 16, 16 ],
        [ "wave.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/wave.gif*/, "wave", 16, 16 ],
        [ "fuji.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/fuji.gif*/, "fuji", 16, 16 ],
        [ "clover.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/clover.gif*/, "clover", 16, 16 ],
        [ "cherry.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/cherry.gif*/, "cherry", 16, 16 ],
        [ "tulip.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/tulip.gif*/, "tulip", 16, 16 ],
        [ "banana.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/banana.gif*/, "banana", 16, 16 ],
        [ "apple.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/apple.gif*/, "apple", 16, 16 ],
        [ "bud.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/bud.gif*/, "bud", 16, 16 ],
        [ "maple.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/maple.gif*/, "maple", 16, 16 ],
        [ "cherryblossom.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/cherryblossom.gif*/, "cherryblossom", 16, 16 ],
        [ "riceball.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/riceball.gif*/, "riceball", 16, 16 ],
        [ "cake.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/cake.gif*/, "cake", 16, 16 ],
        [ "bottle.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/bottle.gif*/, "bottle", 16, 16 ],
        [ "noodle.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/noodle.gif*/, "noodle", 16, 16 ],
        [ "bread.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/bread.gif*/, "bread", 16, 16 ],
        [ "snail.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/snail.gif*/, "snail", 16, 16 ],
        [ "chick.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/chick.gif*/, "chick", 16, 16 ],
        [ "penguin.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/penguin.gif*/, "penguin", 16, 16 ],
        [ "fish.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/fish.gif*/, "fish", 16, 16 ],
        [ "delicious.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/delicious.gif*/, "delicious", 16, 16 ],
        [ "smile.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/smile.gif*/, "smile", 16, 16 ],
        [ "horse.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/horse.gif*/, "horse", 16, 16 ],
        [ "pig.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/pig.gif*/, "pig", 16, 16 ],
        [ "wine.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/wine.gif*/, "wine", 16, 16 ],
        [ "shock.gif"/*tpa=http://www.nogizaka46.com/mt-static/plugins/InsertIcon/js/shock.gif*/, "shock", 16, 16 ]
/*
        [ "ファイル名", "説明", 幅, 高さ ],
        [ "ファイル名", "説明", 幅, 高さ ]
*/
    ];

    var i_file = 0;
    var i_alt = 1;
    var i_width = 2;
    var i_height = 3;
    var toolbarPosition = position;

    this.insertToTextArea = function(v) {
        var e = document.getElementById('comment-text');
        if (document.selection) {
            e.focus();
            var range = document.selection.createRange();
            range.text = v;
        } else {
            var length = e.textLength;
            var start = e.selectionStart;
            var end = e.selectionEnd;
            if (end == 1 || end == 2) end = length;
            e.value = e.value.substring(0, start) + v + e.value.substr(end, length);
            e.selectionStart = start + v.length;
            e.selectionEnd = start + v.length;
        }
        e.focus();
    };

    this.insertIconEditor = function(i) {
        var i_html;

        i_html = '<img src="' + mt_icon_base + mt_icons[i][i_file] + '" class="mt_icon" width="' + mt_icons[i][i_width] + '" height="' + mt_icons[i][i_height] + '" alt="' + mt_icons[i][i_alt] + '" />';
        app.editor.insertContent(i_html);
    };

    this.insertIconFCKeditor = function(i) {
        var i_html;

        i_html = '<img src="' + mt_icon_base + mt_icons[i][i_file] + '" class="mt_icon" width="' + mt_icons[i][i_width] + '" height="' + mt_icons[i][i_height] + '" alt="' + mt_icons[i][i_alt] + ' />';
    };

    this.insertIconTag = function(i) {
        var i_html;

        i_html = '<img src="' + mt_icon_base + mt_icons[i][0] + '" class="mt_icon" width="' + mt_icons[i][i_width] + '" height="' + mt_icons[i][i_height] + '" alt="' + mt_icons[i][i_alt] + '" />';
        this.insertToTextArea(i_html);
    };

    this.insertIconMacro = function(i) {
        var i_html;

        i_html = ':' + mt_icons[i][0] + ':';
        this.insertToTextArea(i_html);
    };

    this.listIconsEditor = function() {
        var i;

        var iconDiv;
        if (toolbarPosition == 1) {
            var tinyMCE_toolbar = jQuery('#editor-input-content_tbl').find('tr[role="presentation"]');
            if (!tinyMCE_toolbar.length) {
                setTimeout(this.listIconsEditor, 500);
                return;
            }
            tinyMCE_toolbar.after('<tr><td><div id="editor-content-iconbar"></div></td></tr>');
            var tinyMCE_toolbar_ex = jQuery('#editor-input-extended_tbl').find('tr[role="presentation"]');
            tinyMCE_toolbar_ex.after('<tr><td><div id="editor-extended-iconbar"></div></td></tr>');
        }
        else {
            jQuery('#editor-content').parent().append('<div id="editor-content-iconbar"></div>');
        }
        var iconDiv = jQuery('#editor-content-iconbar'), iconDiv_ex;
        iconDiv.css('padding', '3px 10px');
        iconDiv.css('border', '1px solid #cccccc');
        if (toolbarPosition == 1) {
            iconDiv.css('width', '522px');	// 20130808
            iconDiv.css('border-bottom', 'none');
            iconDiv_ex = jQuery('#editor-extended-iconbar');
            iconDiv_ex.css('padding', '3px 10px');
            iconDiv_ex.css('border', '1px solid #cccccc');
            iconDiv_ex.css('border-bottom', 'none');
        }
        else {
            iconDiv.css('border-top', 'none');
        }
        iconDiv.css('background-color', '#f3f3f3');
        if (toolbarPosition == 1) {
            iconDiv_ex.css('background-color', '#f3f3f3');
        }
        var html = '';
        for (i = 0; i < mt_icons.length; i++) {
            html += '<img src="' + mt_icon_base + mt_icons[i][i_file] + '" border="0" width="' + mt_icons[i][i_width] + '" height="' + mt_icons[i][i_height] + '" alt="' + mt_icons[i][i_alt] + '" onclick="_fj_insert_icon_obj.insertIconEditor(' + i + ');" style="float:left;cursor : pointer;" />';
        }
        iconDiv.html(html);
        if (toolbarPosition == 1) {
            iconDiv_ex.html(html);
        }
    };

    this.listIconsCommentForm = function(mode) {
        var i;
        var html = '';

        for (i = 0; i < mt_icons.length; i++) {
            if (mode == 'tag') {
                html += '<img src="' + mt_icon_base + mt_icons[i][i_file] + '" border="0" width="' + mt_icons[i][i_width] + '" height="' + mt_icons[i][i_height] + '" alt="' + mt_icons[i][i_alt] + '" onclick="_fj_insert_icon_obj.insertIconTag(' + i + ');" style="cursor : pointer;" />';
            }
            else if (mode == 'macro') {
                html += '<img src="' + mt_icon_base + mt_icons[i][i_file] + '" border="0" width="' + mt_icons[i][i_width] + '" height="' + mt_icons[i][i_height] + '" alt="' + mt_icons[i][i_alt] + '" onclick="_fj_insert_icon_obj.insertIconMacro(' + i + ');" style="cursor : pointer;" />';
            }
        }
        document.write(html);
    };
}
