// Offline-Basisbibliothek: Näherungswerte pro 100 g, abgeleitet aus USDA FoodData Central (SR Legacy, Public Domain) & BLS-typischen Werten.
// Format: Name|Kategorie|kcal|Protein|KH|Fett|Ballaststoffe|Zucker|Portion g|Portionsname
const BASE_FOODS_RAW = `
Apfel|Obst|52|0.3|14|0.2|2.4|10|180|1 Apfel
Banane|Obst|89|1.1|23|0.3|2.6|12|120|1 Banane
Birne|Obst|57|0.4|15|0.1|3.1|10|180|1 Birne
Orange|Obst|47|0.9|12|0.1|2.4|9|150|1 Orange
Mandarine|Obst|53|0.8|13|0.3|1.8|11|70|1 Mandarine
Grapefruit|Obst|42|0.8|11|0.1|1.6|7|250|1 Grapefruit
Zitrone|Obst|29|1.1|9|0.3|2.8|2.5|60|1 Zitrone
Erdbeeren|Obst|32|0.7|7.7|0.3|2|4.9|150|1 Schale
Himbeeren|Obst|52|1.2|12|0.7|6.5|4.4|125|1 Schale
Heidelbeeren|Obst|57|0.7|14|0.3|2.4|10|125|1 Schale
Brombeeren|Obst|43|1.4|10|0.5|5.3|4.9|125|1 Schale
Johannisbeeren rot|Obst|56|1.4|14|0.2|4.3|7.4|100|
Kirschen|Obst|63|1.1|16|0.2|2.1|13|150|1 Handvoll
Weintrauben|Obst|69|0.7|18|0.2|0.9|16|150|1 Schale
Wassermelone|Obst|30|0.6|7.6|0.2|0.4|6.2|300|1 Stück
Honigmelone|Obst|36|0.5|9.1|0.1|0.8|8.1|200|1 Stück
Ananas|Obst|50|0.5|13|0.1|1.4|10|150|1 Portion
Mango|Obst|60|0.8|15|0.4|1.6|14|200|1 Mango
Kiwi|Obst|61|1.1|15|0.5|3|9|75|1 Kiwi
Pfirsich|Obst|39|0.9|10|0.3|1.5|8.4|150|1 Pfirsich
Nektarine|Obst|44|1.1|11|0.3|1.7|7.9|140|1 Nektarine
Aprikose|Obst|48|1.4|11|0.4|2|9.2|35|1 Aprikose
Pflaume|Obst|46|0.7|11|0.3|1.4|9.9|30|1 Pflaume
Granatapfel|Obst|83|1.7|19|1.2|4|14|100|
Avocado|Obst|160|2|8.5|15|6.7|0.7|150|1 Avocado
Feige frisch|Obst|74|0.8|19|0.3|2.9|16|50|1 Feige
Datteln getrocknet|Trockenobst|282|2.5|75|0.4|8|63|8|1 Dattel
Rosinen|Trockenobst|299|3.1|79|0.5|3.7|59|30|1 Handvoll
Aprikosen getrocknet|Trockenobst|241|3.4|63|0.5|7.3|53|30|
Pflaumen getrocknet|Trockenobst|240|2.2|64|0.4|7.1|38|30|
Cranberries getrocknet|Trockenobst|308|0.2|83|1.4|5.3|65|30|
Apfelmus ungesüßt|Obst|42|0.2|11|0.1|1.1|9.4|100|
Tomate|Gemüse|18|0.9|3.9|0.2|1.2|2.6|120|1 Tomate
Cherrytomaten|Gemüse|18|0.9|3.9|0.2|1.2|2.6|100|
Gurke|Gemüse|15|0.7|3.6|0.1|0.5|1.7|100|
Paprika rot|Gemüse|31|1|6|0.3|2.1|4.2|150|1 Paprika
Paprika grün|Gemüse|20|0.9|4.6|0.2|1.7|2.4|150|1 Paprika
Karotte|Gemüse|41|0.9|9.6|0.2|2.8|4.7|80|1 Karotte
Brokkoli|Gemüse|34|2.8|6.6|0.4|2.6|1.7|150|1 Portion
Blumenkohl|Gemüse|25|1.9|5|0.3|2|1.9|150|1 Portion
Rosenkohl|Gemüse|43|3.4|9|0.3|3.8|2.2|150|
Grünkohl|Gemüse|49|4.3|8.8|0.9|3.6|2.3|150|
Weißkohl|Gemüse|25|1.3|5.8|0.1|2.5|3.2|150|
Rotkohl|Gemüse|31|1.4|7.4|0.2|2.1|3.8|150|
Sauerkraut|Gemüse|19|0.9|4.3|0.1|2.9|1.8|150|
Spinat|Gemüse|23|2.9|3.6|0.4|2.2|0.4|100|
Feldsalat|Gemüse|21|2|3.6|0.4|1.5|0.5|50|
Kopfsalat|Gemüse|15|1.4|2.9|0.2|1.3|0.8|50|
Eisbergsalat|Gemüse|14|0.9|3|0.1|1.2|2|50|
Rucola|Gemüse|25|2.6|3.7|0.7|1.6|2|30|
Zucchini|Gemüse|17|1.2|3.1|0.3|1|2.5|200|1 Zucchini
Aubergine|Gemüse|25|1|5.9|0.2|3|3.5|250|1 Aubergine
Zwiebel|Gemüse|40|1.1|9.3|0.1|1.7|4.2|80|1 Zwiebel
Knoblauch|Gemüse|149|6.4|33|0.5|2.1|1|4|1 Zehe
Lauch|Gemüse|61|1.5|14|0.3|1.8|3.9|100|
Frühlingszwiebeln|Gemüse|32|1.8|7.3|0.2|2.6|2.3|15|
Champignons|Gemüse|22|3.1|3.3|0.3|1|2|100|
Pilze gemischt|Gemüse|28|2.5|4.5|0.4|2|1.5|100|
Erbsen grün|Gemüse|81|5.4|14|0.4|5.7|5.7|100|
Grüne Bohnen|Gemüse|31|1.8|7|0.2|2.7|3.3|150|
Mais (Dose)|Gemüse|86|3.3|19|1.4|2|3.2|80|
Kürbis Hokkaido|Gemüse|40|1.7|8.3|0.6|2.5|3|200|
Süßkartoffel|Gemüse|86|1.6|20|0.1|3|4.2|200|1 Süßkartoffel
Kartoffeln gekocht|Beilagen|87|1.9|20|0.1|1.8|0.9|200|1 Portion
Kartoffeln roh|Gemüse|77|2|17|0.1|2.2|0.8|200|
Rote Bete|Gemüse|43|1.6|9.6|0.2|2.8|6.8|100|
Sellerie (Stange)|Gemüse|16|0.7|3|0.2|1.6|1.3|40|1 Stange
Spargel weiß|Gemüse|18|1.9|2|0.1|1.5|1.8|250|
Spargel grün|Gemüse|20|2.2|3.9|0.1|2.1|1.9|200|
Radieschen|Gemüse|16|0.7|3.4|0.1|1.6|1.9|50|
Kohlrabi|Gemüse|27|1.7|6.2|0.1|3.6|2.6|150|
Fenchel|Gemüse|31|1.2|7.3|0.2|3.1|3.9|150|
Oliven grün|Gemüse|145|1|3.8|15|3.3|0.5|30|
Oliven schwarz|Gemüse|115|0.8|6|11|3.2|0|30|
Essiggurken|Gemüse|12|0.5|2.3|0.2|1|1.3|50|
Tomaten passiert|Gemüse|32|1.4|6|0.2|1.5|4|100|
Tomatenmark|Gemüse|82|4.3|19|0.5|4.1|12|20|1 EL
Haferflocken|Getreide|372|13.5|59|7|10|1|50|1 Portion
Müsli ungesüßt|Getreide|360|10|62|6|8|12|50|1 Portion
Cornflakes|Getreide|378|7|84|0.9|3.3|8|30|1 Portion
Granola|Getreide|471|10|64|20|5|25|50|1 Portion
Reis weiß roh|Getreide|360|6.7|79|0.6|1.3|0.1|75|1 Portion roh
Reis weiß gekocht|Beilagen|130|2.7|28|0.3|0.4|0.1|200|1 Portion
Vollkornreis roh|Getreide|362|7.5|76|2.7|3.4|0.9|75|
Vollkornreis gekocht|Beilagen|123|2.7|26|1|1.6|0.2|200|
Basmatireis gekocht|Beilagen|121|3.5|25|0.4|0.4|0|200|
Nudeln roh|Getreide|359|12.5|72|1.5|3|3|100|1 Portion roh
Nudeln gekocht|Beilagen|158|5.8|31|0.9|1.8|0.6|250|1 Portion
Vollkornnudeln roh|Getreide|348|14|65|2.5|9|3|100|
Vollkornnudeln gekocht|Beilagen|149|6|30|1.7|3.9|0.8|250|
Couscous roh|Getreide|376|12.8|77|0.6|5|0|75|
Couscous gekocht|Beilagen|112|3.8|23|0.2|1.4|0.1|200|
Bulgur roh|Getreide|342|12.3|76|1.3|12.5|0.4|75|
Quinoa roh|Getreide|368|14|64|6.1|7|0|75|
Quinoa gekocht|Beilagen|120|4.4|21|1.9|2.8|0.9|185|
Hirse roh|Getreide|378|11|73|4.2|8.5|1.7|75|
Buchweizen roh|Getreide|343|13|72|3.4|10|0|75|
Weizenmehl Type 405|Getreide|364|10|76|1|2.7|0.3|100|
Vollkornmehl|Getreide|340|13|72|2.5|10.7|0.4|100|
Grieß|Getreide|360|12.7|73|1.1|3.9|0|50|
Toastbrot|Brot|265|9|49|3.2|2.7|5|28|1 Scheibe
Vollkorntoast|Brot|247|13|41|3.4|7|6|30|1 Scheibe
Weizenbrötchen|Brot|276|9.4|54|1.9|3|3|55|1 Brötchen
Vollkornbrötchen|Brot|250|10|44|3.5|7|3|60|1 Brötchen
Mischbrot|Brot|228|6.5|46|1.3|5|2|50|1 Scheibe
Vollkornbrot|Brot|214|7|39|1.6|8|2|50|1 Scheibe
Roggenbrot|Brot|224|6.5|45|1.2|7|2|50|1 Scheibe
Pumpernickel|Brot|190|5|38|1|9|2|40|1 Scheibe
Baguette|Brot|272|9|55|1.8|2.4|3|60|1 Stück
Laugenbrezel|Brot|270|8|55|2|2|1|80|1 Brezel
Croissant|Brot|406|8.2|46|21|2.6|11|60|1 Croissant
Knäckebrot|Brot|366|9|69|3|16|2|10|1 Scheibe
Reiswaffel|Brot|387|8|81|2.8|4|0.8|8|1 Waffel
Tortilla Weizen|Brot|306|8|50|8|3.5|2|40|1 Wrap
Fladenbrot|Brot|275|9|55|1.2|2.2|1|100|
Vollmilch 3,5%|Milchprodukte|64|3.3|4.8|3.5|0|4.8|250|1 Glas
Milch 1,5%|Milchprodukte|47|3.4|4.9|1.5|0|4.9|250|1 Glas
Magermilch|Milchprodukte|35|3.4|5|0.1|0|5|250|1 Glas
Hafermilch|Milchprodukte|46|0.8|6.7|1.5|0.8|4|250|1 Glas
Sojamilch ungesüßt|Milchprodukte|33|3.3|0.6|1.8|0.5|0.3|250|1 Glas
Mandelmilch ungesüßt|Milchprodukte|15|0.5|0.3|1.1|0.3|0|250|1 Glas
Joghurt 3,5%|Milchprodukte|61|3.5|4|3.5|0|4|150|1 Becher
Joghurt 1,5%|Milchprodukte|47|3.8|4.5|1.5|0|4.5|150|1 Becher
Griechischer Joghurt 10%|Milchprodukte|133|5|4|10|0|4|150|
Skyr|Milchprodukte|63|11|4|0.2|0|4|150|1 Portion
Magerquark|Milchprodukte|67|12|4|0.3|0|4|250|1 Packung
Quark 20%|Milchprodukte|109|11|3|5|0|3|250|
Hüttenkäse|Milchprodukte|98|11|3.4|4.3|0|2.7|200|1 Becher
Buttermilch|Milchprodukte|37|3.3|4|0.5|0|4|250|1 Glas
Kefir|Milchprodukte|55|3.3|4|3|0|4|250|1 Glas
Sahne 30%|Milchprodukte|292|2.4|3.2|30|0|3.2|30|
Saure Sahne|Milchprodukte|115|3|4|10|0|4|30|
Crème fraîche|Milchprodukte|292|2.4|2.8|30|0|2.8|30|
Gouda|Käse|356|25|2.2|27|0|2.2|30|1 Scheibe
Emmentaler|Käse|380|28|0|30|0|0|30|1 Scheibe
Edamer|Käse|357|25|1.4|28|0|1.4|30|1 Scheibe
Mozzarella|Käse|254|18|1|19|0|1|125|1 Kugel
Mozzarella light|Käse|165|19|1|9|0|1|125|1 Kugel
Feta|Käse|264|14|4|21|0|4|50|
Parmesan|Käse|431|38|4|29|0|0.9|10|1 EL
Camembert|Käse|300|20|0.5|24|0|0.5|30|
Frischkäse|Käse|342|6|4|34|0|3.2|30|
Frischkäse light|Käse|150|8|5|11|0|4|30|
Hirtenkäse|Käse|250|17|1|20|0|1|50|
Harzer Käse|Käse|117|28|0|0.7|0|0|50|
Halloumi|Käse|321|21|2|25|0|2|50|
Butter|Fette|717|0.9|0.1|81|0|0.1|10|1 Portion
Margarine|Fette|717|0.2|0.7|80|0|0|10|
Olivenöl|Fette|884|0|0|100|0|0|10|1 EL
Rapsöl|Fette|884|0|0|100|0|0|10|1 EL
Sonnenblumenöl|Fette|884|0|0|100|0|0|10|1 EL
Kokosöl|Fette|862|0|0|100|0|0|10|1 EL
Mayonnaise|Fette|680|1|0.6|75|0|0.6|15|1 EL
Ei|Eier|143|12.6|0.7|9.5|0|0.4|60|1 Ei (M)
Eiweiß|Eier|52|10.9|0.7|0.2|0|0.7|33|1 Eiweiß
Eigelb|Eier|322|16|3.6|27|0|0.6|17|1 Eigelb
Rührei|Eier|149|10|1.6|11|0|1.4|120|
Hähnchenbrust roh|Fleisch|110|23|0|1.2|0|0|150|1 Filet
Hähnchenbrust gebraten|Fleisch|165|31|0|3.6|0|0|150|1 Filet
Hähnchenschenkel|Fleisch|177|19|0|11|0|0|150|
Putenbrust roh|Fleisch|104|24|0|1|0|0|150|
Putenbrust Aufschnitt|Wurst|104|20|1|2|0|1|20|1 Scheibe
Rinderhack|Fleisch|254|17|0|20|0|0|125|
Rinderhack mager (5%)|Fleisch|137|21|0|5|0|0|125|
Gemischtes Hack|Fleisch|260|18|0|21|0|0|125|
Rindersteak|Fleisch|180|26|0|8.5|0|0|200|1 Steak
Rinderfilet|Fleisch|143|22|0|6|0|0|180|
Schweinefilet|Fleisch|122|21|0|4|0|0|150|
Schweineschnitzel|Fleisch|125|22|0|4|0|0|150|
Schweinenacken|Fleisch|220|18|0|16|0|0|150|
Lammfleisch|Fleisch|282|17|0|23|0|0|150|
Speck|Wurst|541|37|1.4|42|0|0|30|
Kochschinken|Wurst|108|19|1|3|0|1|20|1 Scheibe
Schinken roh|Wurst|250|26|0|16|0|0|20|1 Scheibe
Salami|Wurst|380|22|1|32|0|1|10|1 Scheibe
Wiener Würstchen|Wurst|260|13|1|23|0|1|50|1 Würstchen
Bratwurst|Wurst|300|13|1|27|0|0.5|100|1 Bratwurst
Leberwurst|Wurst|326|14|2|29|0|1|20|
Fleischwurst|Wurst|285|12|1|26|0|0.5|30|
Lachs|Fisch|208|20|0|13|0|0|125|1 Filet
Räucherlachs|Fisch|117|18|0|4.3|0|0|50|
Thunfisch (Dose, Wasser)|Fisch|116|26|0|1|0|0|130|1 Dose
Thunfisch (Dose, Öl)|Fisch|198|29|0|8|0|0|130|1 Dose
Kabeljau|Fisch|82|18|0|0.7|0|0|150|
Seelachs|Fisch|92|19|0|1|0|0|150|
Forelle|Fisch|119|20|0|3.5|0|0|150|
Hering|Fisch|158|18|0|9|0|0|100|
Makrele|Fisch|205|19|0|14|0|0|100|
Garnelen|Fisch|85|20|0|0.5|0|0|100|
Fischstäbchen|Fisch|220|12|19|10|1|1|30|1 Stäbchen
Sardinen in Öl|Fisch|208|25|0|11|0|0|90|
Linsen roh|Hülsenfrüchte|352|25|60|1.1|11|2|60|
Linsen gekocht|Hülsenfrüchte|116|9|20|0.4|7.9|1.8|200|
Rote Linsen roh|Hülsenfrüchte|358|24|63|2.2|11|2|60|
Kichererbsen gekocht|Hülsenfrüchte|164|8.9|27|2.6|7.6|4.8|150|
Kidneybohnen gekocht|Hülsenfrüchte|127|8.7|23|0.5|6.4|0.3|150|
Weiße Bohnen gekocht|Hülsenfrüchte|139|9.7|25|0.4|6.3|0.3|150|
Schwarze Bohnen gekocht|Hülsenfrüchte|132|8.9|24|0.5|8.7|0.3|150|
Edamame|Hülsenfrüchte|121|12|9|5|5|2|100|
Tofu natur|Hülsenfrüchte|144|15|3|8.7|2.3|0.6|100|
Räuchertofu|Hülsenfrüchte|170|17|2|10|2|1|100|
Tempeh|Hülsenfrüchte|192|20|7.6|11|0|0|100|
Hummus|Hülsenfrüchte|166|7.9|14|9.6|6|0.3|50|
Sojageschnetzeltes trocken|Hülsenfrüchte|330|50|20|1.5|18|8|50|
Mandeln|Nüsse|579|21|22|50|12.5|4.4|30|1 Handvoll
Walnüsse|Nüsse|654|15|14|65|6.7|2.6|30|1 Handvoll
Haselnüsse|Nüsse|628|15|17|61|9.7|4.3|30|1 Handvoll
Cashewkerne|Nüsse|553|18|30|44|3.3|5.9|30|1 Handvoll
Erdnüsse|Nüsse|567|26|16|49|8.5|4|30|1 Handvoll
Erdnüsse geröstet gesalzen|Nüsse|599|28|15|52|8|4|30|
Pistazien|Nüsse|560|20|28|45|10.6|7.7|30|
Paranüsse|Nüsse|659|14|12|67|7.5|2.3|30|
Macadamia|Nüsse|718|7.9|14|76|8.6|4.6|30|
Erdnussbutter|Nüsse|588|25|20|50|6|9|15|1 EL
Mandelmus|Nüsse|614|21|19|56|10|4.4|15|1 EL
Chiasamen|Nüsse|486|17|42|31|34|0|15|1 EL
Leinsamen|Nüsse|534|18|29|42|27|1.6|10|1 EL
Sonnenblumenkerne|Nüsse|584|21|20|51|8.6|2.6|20|
Kürbiskerne|Nüsse|559|30|11|49|6|1.4|20|
Sesam|Nüsse|573|18|23|50|12|0.3|10|
Kokosraspeln|Nüsse|660|6.9|24|65|16|7.4|10|
Zucker|Süßes|387|0|100|0|0|100|5|1 TL
Honig|Süßes|304|0.3|82|0|0.2|82|20|1 EL
Ahornsirup|Süßes|260|0|67|0.1|0|60|20|1 EL
Marmelade|Süßes|250|0.4|62|0.1|1|50|20|1 EL
Nuss-Nougat-Creme|Süßes|539|6.3|57|31|3.4|56|15|1 EL
Vollmilchschokolade|Süßes|535|7.7|59|30|3.4|52|25|1 Riegel
Zartbitterschokolade 70%|Süßes|598|7.8|46|43|11|24|25|
Gummibärchen|Süßes|343|6.9|77|0.1|0|46|25|1 Handvoll
Kekse (Butterkeks)|Süßes|440|7.5|72|12|2.5|23|8|1 Keks
Schokoladenkekse|Süßes|490|5.5|65|23|3|33|12|1 Keks
Croissant mit Schokolade|Süßes|420|7|48|22|2.5|17|70|
Muffin|Süßes|377|5|53|16|1.5|30|80|1 Muffin
Donut|Süßes|421|5|50|23|1.3|22|60|1 Donut
Käsekuchen|Süßes|260|7|23|15|0.3|17|120|1 Stück
Apfelstrudel|Süßes|274|3|41|11|2|20|120|1 Stück
Vanilleeis|Süßes|207|3.5|24|11|0.7|21|100|1 Kugel ≈ 60 g
Pudding Schoko|Süßes|112|3.3|18|3|0.5|14|125|1 Becher
Müsliriegel|Süßes|420|6|65|14|5|28|25|1 Riegel
Proteinriegel|Süßes|360|33|35|11|5|3|60|1 Riegel
Kartoffelchips|Snacks|536|7|53|35|4.4|0.4|30|1 Handvoll
Salzstangen|Snacks|380|10|78|2.5|3|2|30|
Popcorn gesalzen|Snacks|500|9|55|28|10|1|30|
Tortillachips|Snacks|489|7|63|23|5|1|30|
Studentenfutter|Snacks|480|13|45|28|6|30|30|1 Handvoll
Proteinpulver Whey|Supplemente|380|78|7|5|0|5|30|1 Messlöffel
Proteinpulver vegan|Supplemente|380|75|8|6|5|2|30|1 Messlöffel
Kreatin|Supplemente|0|0|0|0|0|0|5|
Wasser|Getränke|0|0|0|0|0|0|250|1 Glas
Kaffee schwarz|Getränke|2|0.1|0|0|0|0|200|1 Tasse
Cappuccino|Getränke|35|2|3|1.8|0|3|200|1 Tasse
Latte Macchiato|Getränke|48|2.6|3.8|2.5|0|3.8|300|1 Glas
Tee ungesüßt|Getränke|1|0|0.2|0|0|0|250|1 Tasse
Orangensaft|Getränke|45|0.7|10|0.2|0.2|8.4|250|1 Glas
Apfelsaft|Getränke|46|0.1|11|0.1|0.2|10|250|1 Glas
Apfelschorle|Getränke|24|0|5.5|0|0|5.5|330|1 Glas
Cola|Getränke|42|0|10.6|0|0|10.6|330|1 Dose
Cola Zero|Getränke|0.3|0|0|0|0|0|330|1 Dose
Limonade|Getränke|40|0|10|0|0|10|330|
Eistee|Getränke|30|0|7.5|0|0|7.5|330|
Energy Drink|Getränke|45|0|11|0|0|11|250|1 Dose
Bier (Pils)|Getränke|42|0.5|3|0|0|0|500|1 Flasche 0,5 l
Bier alkoholfrei|Getränke|26|0.4|5.5|0|0|3|500|1 Flasche 0,5 l
Weißwein trocken|Getränke|82|0.1|2.6|0|0|1|200|1 Glas
Rotwein trocken|Getränke|85|0.1|2.6|0|0|0.6|200|1 Glas
Sekt|Getränke|80|0.2|3|0|0|2|100|1 Glas
Smoothie Frucht|Getränke|55|0.6|12|0.2|1.2|10|250|
Ketchup|Saucen|112|1.2|26|0.1|0.3|22|15|1 EL
Senf|Saucen|66|4|5.3|3.3|3.3|0.9|10|1 TL
Sojasauce|Saucen|53|8|4.9|0.6|0.8|0.4|15|1 EL
Pesto Genovese|Saucen|480|5|6|48|2|2|30|
Tomatensauce (Fertig)|Saucen|50|1.5|8|1.2|1.5|6|125|
Balsamico|Saucen|88|0.5|17|0|0|15|10|1 EL
Salatdressing (Joghurt)|Saucen|150|1.5|8|12|0|6|30|
BBQ-Sauce|Saucen|172|0.8|41|0.6|0.9|33|20|
Bratensoße|Saucen|50|1.5|7|1.5|0|1|60|
Pizza Margherita|Gerichte|250|10|31|9.5|2|3.5|350|1 Pizza (halb ≈ 175 g)
Pizza Salami|Gerichte|275|11|29|13|2|3|350|
Tiefkühlpizza|Gerichte|240|10|28|9|2|3|350|1 Pizza
Spaghetti Bolognese|Gerichte|145|7.5|17|5|1.5|2.5|400|1 Teller
Spaghetti Carbonara|Gerichte|210|9|22|10|1|1|400|1 Teller
Lasagne|Gerichte|165|9|14|8|1.2|3|350|1 Portion
Nudelsalat|Gerichte|200|4|20|12|1.5|3|200|
Kartoffelsalat (Mayo)|Gerichte|170|2.5|13|12|1.5|2|200|
Kartoffelsalat (Essig-Öl)|Gerichte|110|2|15|5|1.5|1.5|200|
Bratkartoffeln|Gerichte|150|2.5|20|7|2|0.5|250|
Pommes frites|Gerichte|312|3.4|41|15|3.8|0.3|150|1 Portion
Kartoffelpüree|Gerichte|88|2|13|3.2|1.2|1.5|200|
Kroketten|Gerichte|210|3|28|9|2.5|1|120|
Wiener Schnitzel|Gerichte|235|17|13|13|0.6|0.5|180|1 Schnitzel
Currywurst mit Soße|Gerichte|230|10|10|17|0.5|8|200|
Döner Kebab|Gerichte|215|11|20|10|1.5|2.5|350|1 Döner
Falafel|Gerichte|333|13|32|18|5|1|100|
Hamburger|Gerichte|254|13|28|10|1.5|5|130|1 Burger
Cheeseburger|Gerichte|263|14|26|12|1.5|6|140|1 Burger
Chicken Nuggets|Gerichte|296|15|17|19|1|0.5|100|ca. 6 Stück
Sushi Maki (Lachs)|Gerichte|150|5.8|28|1.5|0.8|5|25|1 Stück
Chili con Carne|Gerichte|110|8|9|4.5|3.5|2.5|400|1 Teller
Gulasch|Gerichte|120|13|4|6|0.5|2|300|
Hühnerfrikassee|Gerichte|130|11|5|7|0.5|1|300|
Rinderroulade|Gerichte|170|20|3|9|0.5|1.5|200|
Frikadelle|Gerichte|245|15|9|17|0.5|1|100|1 Frikadelle
Käsespätzle|Gerichte|230|10|23|11|1.2|1|350|
Maultaschen|Gerichte|190|8|25|6|1.5|1.5|200|
Gemüsepfanne|Gerichte|70|2.5|8|3|2.5|4|300|
Gemüsecurry mit Kokosmilch|Gerichte|105|2.5|8|7|2.5|3.5|350|
Hähnchencurry|Gerichte|130|11|5|7.5|1|2.5|350|
Gebratener Reis|Gerichte|170|5|26|5.5|1|1|300|
Gebratene Nudeln|Gerichte|175|6|24|6|1.5|2|300|
Rührei mit Speck|Gerichte|215|14|1|17|0|0.8|150|
Omelett|Gerichte|154|11|0.6|12|0|0.4|150|
Pfannkuchen|Gerichte|227|6.4|28|10|0.9|5|80|1 Pfannkuchen
Waffel|Gerichte|291|7.9|33|14|1.4|7|75|1 Waffel
Porridge mit Milch|Gerichte|100|4|14|3|1.5|5|300|1 Schale
Linsensuppe|Gerichte|75|5|10|1.5|3|1.5|400|1 Teller
Tomatensuppe|Gerichte|45|1|7|1.5|0.8|4.5|300|1 Teller
Kartoffelsuppe|Gerichte|65|2|9|2.5|1|1|400|1 Teller
Hühnersuppe|Gerichte|40|3|4|1.3|0.3|0.5|400|1 Teller
Erbseneintopf|Gerichte|90|6|10|3|3.5|1.5|400|
Caesar Salad|Gerichte|130|7|6|9|1.5|1.5|250|
Griechischer Salat|Gerichte|105|3.5|4.5|8.5|1.5|2.5|250|
Gemischter Salat (ohne Dressing)|Gerichte|17|1.2|3|0.2|1.6|1.5|150|
Wrap mit Hähnchen|Gerichte|200|11|20|8|2|2|250|
Belegtes Brötchen (Käse)|Gerichte|280|12|30|12|2|2|100|
Belegtes Brötchen (Schinken)|Gerichte|240|12|31|7|2|2|100|
Bowl (Reis, Huhn, Gemüse)|Gerichte|140|9|17|4|2|2|450|1 Bowl
Burrito|Gerichte|190|8|23|7|3|1.5|300|
Tacos|Gerichte|226|9|20|12|3|1.5|80|1 Taco
Risotto|Gerichte|150|4|22|5|0.8|0.8|300|
Ratatouille|Gerichte|60|1.3|6|3.5|2|4|250|
Ofengemüse|Gerichte|85|1.8|9|4.5|3|4|300|
Leberkäse|Wurst|297|12|3|26|0|1|100|1 Scheibe
Weißwurst|Wurst|285|11|1|26|0|0.5|80|1 Weißwurst
Mortadella|Wurst|311|15|1|28|0|1|20|1 Scheibe
Putenwiener|Wurst|180|14|1|13|0|1|50|1 Würstchen
Chorizo|Wurst|455|24|2|38|0|1|20|
Hähnchenbrust Aufschnitt|Wurst|100|21|1|1.5|0|1|20|1 Scheibe
Rinderhüftsteak|Fleisch|136|23|0|4.5|0|0|200|1 Steak
Hähnchenflügel|Fleisch|203|18|0|14|0|0|100|
Hackbraten|Gerichte|210|15|7|14|0.5|1.5|150|1 Scheibe
Schweinebraten|Gerichte|200|25|1|11|0|0|150|1 Portion
Sauerbraten|Gerichte|160|22|6|5|0.5|4|200|
Kassler|Fleisch|160|21|0.5|8|0|0.5|150|
Döner Teller|Gerichte|180|12|14|8|1.5|2|450|1 Teller
Dürüm|Gerichte|220|11|22|10|2|2|350|1 Dürüm
Lahmacun|Gerichte|210|9|30|6|2|2|200|1 Stück
Flammkuchen|Gerichte|260|8|26|14|1.5|2|300|
Spätzle|Beilagen|155|5.5|28|2.2|1.5|0.5|200|1 Portion
Semmelknödel|Beilagen|190|6|33|3.5|2|2|120|1 Knödel
Kartoffelknödel|Beilagen|115|2|24|1|2|0.5|120|1 Knödel
Gnocchi|Beilagen|150|3.5|32|0.5|1.5|0.5|200|1 Portion
Schupfnudeln|Beilagen|170|4|33|2|2|0.5|200|
Reibekuchen|Gerichte|220|3|25|12|3|1|100|1 Stück
Rotkohl (Glas)|Gemüse|60|1.2|12|0.5|2|10|150|
Ofenkartoffel|Beilagen|93|2.5|21|0.1|2.2|1.2|250|1 Kartoffel
Kartoffelgratin|Gerichte|130|4|11|8|1|1.5|250|
Reis mit Gemüse|Gerichte|120|3|22|2|1.5|1.5|300|
Udon-Nudeln gekocht|Beilagen|105|2.6|21|0.4|1|0.3|200|
Reisnudeln gekocht|Beilagen|108|1.8|24|0.2|1|0|200|
Glasnudeln gekocht|Beilagen|90|0.1|22|0.1|0.5|0|150|
Ramen (Instant)|Gerichte|440|9|60|18|2.5|2|80|1 Packung
Pho|Gerichte|60|4.5|7|1.5|0.5|0.8|500|1 Schale
Pad Thai|Gerichte|175|8|22|6|1.5|5|350|
Sushi Nigiri (Lachs)|Gerichte|170|8|25|3.5|0.3|5|35|1 Stück
Poke Bowl|Gerichte|140|8|18|4|2|3|450|1 Bowl
Butter Chicken|Gerichte|150|11|5|9.5|1|3|350|
Paella|Gerichte|155|8|20|4.5|1|1|350|
Shakshuka|Gerichte|90|5.5|6|5|1.5|4|300|
Moussaka|Gerichte|140|7|9|8.5|2|3.5|350|
Gyros|Gerichte|230|19|3|16|0.5|1|200|
Zaziki|Saucen|110|4|4|8.5|0.3|3.5|50|
Tahini|Nüsse|595|17|21|54|9|0.5|15|1 EL
Guacamole|Saucen|155|2|8.5|13|6|1|50|
Salsa|Saucen|36|1.5|7|0.2|1.8|4|50|
Aioli|Saucen|640|1|3|70|0|1|15|1 EL
Remoulade|Saucen|500|1|8|52|0|6|20|
Hollandaise|Saucen|490|3|5|51|0|1.5|30|
Currysauce|Saucen|110|1|20|3|1|17|30|
Süß-sauer-Sauce|Saucen|150|0.4|36|0.2|0.4|30|30|
Ajvar|Saucen|80|1.4|9|4|2|7|30|
Kräuterbutter|Fette|630|1|2|69|0|1|10|
Ghee|Fette|900|0|0|100|0|0|10|1 EL
Leinöl|Fette|884|0|0|100|0|0|10|1 EL
Rinderbrühe|Getränke|5|0.6|0.2|0.2|0|0|250|1 Tasse
Gemüsebrühe|Getränke|6|0.3|1|0.1|0|0.5|250|1 Tasse
Proteinshake mit Milch|Getränke|85|10|5.5|2.5|0|5.5|330|1 Shake
Protein-Pudding|Milchprodukte|80|10|6|1.5|0.5|4|200|1 Becher
Protein-Joghurt|Milchprodukte|60|10|4|0.2|0|4|200|1 Becher
Skyr Vanille|Milchprodukte|75|9|8|0.2|0|8|150|
Fruchtjoghurt|Milchprodukte|95|3.2|14|2.8|0.2|13|150|1 Becher
Grießpudding|Milchprodukte|105|3.5|16|3|0.2|10|150|1 Becher
Milchreis|Milchprodukte|115|3.3|19|2.8|0.3|9|200|1 Becher
Kakao (Milch)|Getränke|80|3.5|10|3|0.5|9.5|250|1 Tasse
Trinkschokolade Pulver|Süßes|380|5|80|3|6|75|15|1 EL
Ayran|Milchprodukte|35|1.7|2.6|1.8|0|2.6|250|1 Glas
Burrata|Käse|330|17|1|29|0|1|125|1 Kugel
Ricotta|Käse|174|11|3|13|0|0.3|50|
Mascarpone|Käse|429|4.6|4|44|0|3.5|30|
Bergkäse|Käse|400|29|0|32|0|0|30|1 Scheibe
Butterkäse|Käse|340|21|0|28|0|0|30|1 Scheibe
Scheibenkäse light|Käse|260|30|0|16|0|0|25|1 Scheibe
Schmelzkäse|Käse|260|11|6|21|0|5|20|1 Ecke
Grillkäse|Käse|320|21|1|26|0|1|100|
Veganer Käse|Käse|280|1|21|22|0|0|25|1 Scheibe
Tofu-Würstchen|Hülsenfrüchte|220|16|5|15|2|1|50|
Vegane Burger-Patty|Hülsenfrüchte|230|17|6|15|3|1|113|1 Patty
Seitan|Hülsenfrüchte|370|75|14|1.9|0.6|0|100|
Erbsenprotein-Hack|Hülsenfrüchte|200|17|4|12|3|0.5|125|
Haferkleie|Getreide|246|17|66|7|15|1.5|30|
Dinkelflocken|Getreide|355|13|64|2.5|9|1.5|50|
Puffreis|Getreide|380|7|84|1|1.5|0.5|20|
Schokomüsli|Getreide|430|8.5|65|14|7|20|50|1 Portion
Overnight Oats|Gerichte|130|5|18|4|2.5|6|300|1 Glas
Brezelbrötchen|Brot|265|9|51|2.5|2.5|1|80|1 Stück
Dinkelbrot|Brot|240|8|44|2|5|2|50|1 Scheibe
Körnerbrötchen|Brot|285|11|42|7|6|2|70|1 Brötchen
Ciabatta|Brot|271|9|51|3|2.3|2|80|
Bagel|Brot|257|10|50|1.5|2.2|5|90|1 Bagel
Burger-Brötchen|Brot|280|9|49|5|2.4|6|60|1 Brötchen
Pita|Brot|275|9|56|1.2|2.2|1.3|60|1 Pita
Hefezopf|Süßes|330|8|52|9|2|14|50|1 Scheibe
Berliner|Süßes|370|6|47|17|1.5|17|80|1 Berliner
Franzbrötchen|Süßes|400|6|48|20|1.5|18|90|1 Stück
Streuselkuchen|Süßes|390|5|52|18|1.3|25|100|1 Stück
Schwarzwälder Kirschtorte|Süßes|260|4|28|14|1|20|120|1 Stück
Marmorkuchen|Süßes|400|6|50|19|1.2|28|70|1 Stück
Brownie|Süßes|466|6|50|27|2.5|36|60|1 Brownie
Tiramisu|Süßes|280|5|28|16|0.5|22|120|1 Portion
Lebkuchen|Süßes|380|5|72|7|3|45|25|1 Stück
Spekulatius|Süßes|480|6|70|19|2|32|10|1 Keks
Marzipan|Süßes|470|8|56|24|5|50|25|
Schokoriegel (Snickers-Typ)|Süßes|488|8.6|60|24|2.3|50|50|1 Riegel
Schokoriegel Waffel (KitKat-Typ)|Süßes|518|6.5|61|27|2|48|42|1 Riegel
Fruchtgummi vegan|Süßes|330|0.5|80|0.2|0.5|50|25|
Lakritz|Süßes|375|3.5|83|2|1|40|25|
Eis am Stiel (Schoko)|Süßes|290|3.5|27|19|1|24|70|1 Stück
Sorbet|Süßes|130|0.3|32|0|0.5|28|100|1 Kugel
Frozen Joghurt|Süßes|160|4|30|3|0|26|100|
Erdnussflips|Snacks|550|14|52|32|4|2|30|
Reiscracker|Snacks|390|7|83|2|1|2|25|
Gemüsechips|Snacks|500|4|55|30|10|20|30|
Beef Jerky|Snacks|300|50|12|5|0|10|25|1 Packung
Edamame geröstet|Snacks|420|40|30|15|15|3|30|
Proteinchips|Snacks|420|40|35|13|5|3|30|1 Tüte
Nussmix ungesalzen|Nüsse|610|19|15|52|8|4|30|1 Handvoll
Pekannüsse|Nüsse|691|9|14|72|9.6|4|30|
Pinienkerne|Nüsse|673|14|13|68|3.7|3.6|10|
Hanfsamen|Nüsse|553|32|9|49|4|1.5|15|1 EL
Mango getrocknet|Trockenobst|320|2.5|78|1|2.5|66|30|
Bananenchips|Trockenobst|519|2.3|58|34|7.7|35|30|
Physalis|Obst|53|1.9|11|0.7|1|0|50|
Litschi|Obst|66|0.8|17|0.4|1.3|15|100|
Papaya|Obst|43|0.5|11|0.3|1.7|8|150|
Maracuja|Obst|97|2.2|23|0.7|10|11|20|1 Frucht
Clementine|Obst|47|0.9|12|0.2|1.7|9|75|1 Clementine
Rhabarber|Gemüse|21|0.9|4.5|0.2|1.8|1.1|100|
Pak Choi|Gemüse|13|1.5|2.2|0.2|1|1.2|150|
Chinakohl|Gemüse|16|1.2|3.2|0.2|1.2|1.4|150|
Wirsing|Gemüse|27|2|6|0.1|3.1|2.3|150|
Pastinake|Gemüse|75|1.2|18|0.3|4.9|4.8|150|
Steckrübe|Gemüse|37|1.1|8.6|0.2|2.3|4.5|150|
Topinambur|Gemüse|73|2|17|0|1.6|9.6|100|
Artischockenherzen|Gemüse|47|3.3|10|0.2|5.4|1|100|
Kapern|Gemüse|23|2.4|4.9|0.9|3.2|0.4|10|
Getrocknete Tomaten in Öl|Gemüse|213|5|23|14|5.8|15|20|
Jalapeños|Gemüse|29|0.9|6.5|0.4|2.8|4|20|
Kimchi|Gemüse|23|1.1|4|0.5|1.6|1.1|100|
Sojasprossen|Gemüse|30|3|5.9|0.2|1.8|4|100|
Algen (Nori)|Gemüse|35|5.8|5.1|0.3|0.3|0.5|3|1 Blatt
Kokosmilch|Fette|197|2|2.8|21|0|2|100|
Kokosmilch light|Fette|73|0.7|1.8|7|0|1.5|100|
Mehrkornbrötchen|Brot|265|10|45|5|6|2|65|1 Brötchen
Sandwich Thunfisch|Gerichte|230|11|24|10|2|2.5|180|1 Sandwich
Kartoffelsuppe mit Würstchen|Gerichte|95|4|9|5|1|1|400|1 Teller
Gulaschsuppe|Gerichte|65|5|5|3|0.8|1.5|400|1 Teller
Minestrone|Gerichte|40|1.8|6|1|1.5|2|400|1 Teller
Kürbissuppe|Gerichte|55|1|6|3|1.2|3|400|1 Teller
Linsen-Dal|Gerichte|120|6|15|4|4|2|350|
Falafel-Wrap|Gerichte|230|7|29|10|4|3|300|1 Wrap
Quarkbällchen|Süßes|370|7|45|18|1|18|25|1 Stück
Käsebrötchen überbacken|Gerichte|300|12|32|13|2|2|90|1 Brötchen
Fischbrötchen (Matjes)|Gerichte|255|10|22|14|1.5|3|150|1 Brötchen
Backfisch|Gerichte|230|14|14|13|0.8|0.8|150|
Lachsfilet gebraten|Fisch|206|22|0|13|0|0|125|1 Filet
Matjes|Fisch|260|16|0|22|0|0|50|1 Filet
Tintenfischringe frittiert|Fisch|215|12|17|11|1|0.5|100|
Miesmuscheln|Fisch|86|12|3.7|2.2|0|0|200|
Thunfischsteak|Fisch|130|28|0|1.3|0|0|150|
Zander|Fisch|84|19|0|0.7|0|0|150|
Tofu geräuchert Aufschnitt|Hülsenfrüchte|170|17|2|10|2|1|20|1 Scheibe
Weißweinschorle|Getränke|40|0|1.3|0|0|0.5|250|1 Glas
Radler|Getränke|39|0.3|6|0|0|5.5|500|1 Flasche 0,5 l
Weizenbier|Getränke|45|0.5|3.5|0|0|0|500|1 Flasche 0,5 l
Aperol Spritz|Getränke|90|0|9|0|0|8|200|1 Glas
Gin Tonic|Getränke|85|0|7|0|0|7|250|1 Glas
Wodka|Getränke|231|0|0|0|0|0|20|1 Shot
Spezi|Getränke|42|0|10.5|0|0|10.5|500|1 Flasche
Mate-Limonade|Getränke|26|0|6.5|0|0|6.5|500|1 Flasche
Iso-Drink|Getränke|25|0|6|0|0|5.5|500|1 Flasche
Kokoswasser|Getränke|19|0.7|3.7|0.2|1.1|2.6|330|
Gemüsesaft|Getränke|22|0.9|4|0.2|0.9|3|250|1 Glas
Multivitaminsaft|Getränke|50|0.3|11.5|0.1|0.2|11|250|1 Glas
Espresso|Getränke|2|0.1|0|0.2|0|0|30|1 Tasse
Flat White|Getränke|55|3|4.5|3|0|4.5|180|1 Tasse
Chai Latte|Getränke|70|2.5|11|2|0|10|300|
Matcha Latte|Getränke|50|2.6|6|1.8|0|5.5|300|
`.trim();

const BASE_FOODS = BASE_FOODS_RAW.split('\n').map((l, i) => {
  const [name, cat, kcal, p, c, f, fib, sug, pg, pn] = l.split('|');
  return { id: 'base:' + i, src: 'base', name, cat, n: { kcal:+kcal, p:+p, c:+c, f:+f, fib:+fib, sug:+sug, salt:0 },
    serving: +pg ? { g:+pg, label: pn || (pg + ' g') } : null };
});
