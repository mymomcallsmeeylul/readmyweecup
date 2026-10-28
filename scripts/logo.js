/**
 * The mark, traced from the source artwork to polygons.
 *
 * One copy of the path data for everything that draws it in script. The page
 * inlines the same paths in index.html so the mark needs no JavaScript to
 * appear, and favicon.svg carries it again on its own ground; a test asserts
 * all three still agree, because three hand-kept copies of the same drawing
 * is three chances for one of them to quietly become a different logo.
 *
 * Even-odd fill, so a mark with a hole in it keeps the hole.
 */

export const LOGO_VIEWBOX = '0 0 866.1 1000';

export const LOGO_PATHS = [
  "M844.5,0 857.3,0 866.1,8.9 866.1,21.7 854.3,40.4 846.5,62 669.3,426.2 657.5,451.8 655.5,464.6 657.5,470.5 665.4,476.4 853.3,539.4 861.2,550.2 859.3,560 852.4,566.9 840.6,567.9 644.7,547.2 626,547.2 618.1,553.1 616.1,560 703.7,966.5 703.7,994.1 695.9,1000 687,1000 677.2,991.1 535.4,603.3 527.6,594.5 511.8,594.5 370.1,657.5 358.3,665.4 185,740.2 173.2,748 163.4,751 151.6,748 145.7,739.2 145.7,731.3 155.5,720.5 427.2,551.2 439,541.3 440.9,531.5 429.1,516.7 12.8,216.5 0,205.7 0,192.9 4.9,187 12.8,183.1 24.6,185 465.6,409.4 476.4,409.4 483.3,405.5 487.2,391.7 400.6,196.9 400.6,188 405.5,181.1 412.4,177.2 421.3,178.1 433.1,190.9 555.1,387.8 563,393.7 572.8,393.7 590.6,373 796.3,66.9 844.5,0Z",
];
