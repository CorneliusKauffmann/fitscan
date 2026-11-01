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
`.trim();

const BASE_FOODS = BASE_FOODS_RAW.split('\n').map((l, i) => {
  const [name, cat, kcal, p, c, f, fib, sug, pg, pn] = l.split('|');
  return { id: 'base:' + i, src: 'base', name, cat, n: { kcal:+kcal, p:+p, c:+c, f:+f, fib:+fib, sug:+sug, salt:0 },
    serving: +pg ? { g:+pg, label: pn || (pg + ' g') } : null };
});
