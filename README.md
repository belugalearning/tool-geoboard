### Overview

The geoboard sets up a board of pins in different configurations, allows users to add bands that join the pins, and drag and drop the bands into different shapes. It also evaluates and displays various properties of the shapes.


### Initialising

When the tool is run, it sets up a geoboard with pins and various buttons that allow the user to control the tool and display different properties. Pressing a button that changes the geoboard type will remove the geoboard and initialise a new one.


### Geoboards

There are three types of geoboard. Square geoboard and triangle geoboard, which both inherit from a RegularGeoboard class, and circle geoboard. On initialisation, each of these will add child sprites for the pins, which are referred to in an array. The geoboard has an array containing all the bands that are on it, as well as methods to add and remove bands, select particular bands, reorder the bands, and calculate properties that involve more than one band (for example, grouping angles of the same sides will consider the all angles of all bands on the board, whereas finding the area will only find the area of the currently selected band).

The circle geoboard has extra controls for changing its configuration, adding/removing pins around the outside and toggling the centre pin. Doing this while there is a band on the geoboard will move the band around.


### Bands

A band holds an array of pins, each of which is one of the pins on the band's geoboard, an array of bandparts, sprites that join one pin to another, and other nodes for angles, side lengths and area that start off being invisble. The band goes through each of the following processes for each of these user interactions:

* Clicking on the band: the band creates a 'moving pin', a pin that is draggable and looks like a hand instead of a pin. If the user clicks on one of the pins, it replaces that pin in the pins array with the moving pin. If the user clicks on a bandpart, it adds the moving pin in the pins array between the two endpoint pins for that bandpart. It then removes all the bandpart sprites and creates new ones joining each consecutive pair of pins in the pins array. It also creates new angles/side lengths and redraws the area.

* Dragging the moving pin: each time the mouse moves, it alters the angles and scaling of the bandparts as necessary so that they all appear correctly. It also sets the values of the angles and side length labels and redraws the area.

* Releasing the moving pin will remove it from the band. If it is released over a pin it will replace the moving pin in the pins array with this pin, otherwise it will remove the moving pin. It then sets up all the band parts and angles as before, and removes redundant pins (either pins the band visits twice in succession or ones that the band passes straight through), resets the bandparts and angles etc., and, sets up the properties for that band and tells the geoboard to set up the properties that refer to more than one band.

The band will store the answer to the property calculations and only recalculate them once the band has been changed.


### Properties

The properties that are calculated are:

* Whether the shape is regular or not (i.e., has all equal sides and angles)

* The name of the shape. The name will always be as specific as possible (e.g., if the shape is a rectangle it will always display "Rectangle" even though it would also be valid to say "Parallelogram"). The ones covered are:
	* Triangles:
		* Equilateral triangle
		* Isoceles triangle
		* Scalene triangle
	* Quadrilaterals:
		* Square
		* Rectangle
		* Rhombus
		* Parallelogram
		* Trapezium
		* Kite
		* Quadrilateral (i.e., none of the above)
	* Others:
		* Pentagon
		* Hexagon
		* Heptagon
		* Octagon
		* Nonagon
		* Decagon
		* Polygon (for 11 sides or more)

* Perimeter. This is always the total length of the sides. If the band crosses over itself this will not display this as this may be ambiguous (e.g., are we displaying the total side length or the perimeter of the outside of the band).

* Area. Again, this doesn't display if the band crosses over itself. This is the most complicated property to calculate and has been the cause of bugs in the past. See the "Area" subsection. There is also a drawNode tinting the inside of the current band.

* Angles. This displays a label for every angle of every band on the board, with the value of that angle in degrees. The angle is drawn using a drawNode, displaying a sector on the angle. The angles will always be the ones on the inside of the shape when it has an unambiguous inside and outside (i.e., when the band does not cross over itself) but may display the exterior angle when it does not. band parts crossing over each other do not display an angle.

* Same angles. Same as above, except instead of displaying the size of the angles it displays arcs at pairs of angles, where the same number of arcs indicates the same angles.

* Side lengths. Displays lables on each bandpart on the board indicating the side length

* Same side lengths. Same as above but with notches to indicate same side lengths.

* Parallel sides. Same as above but with arrows to indicate parallel sides.


### Calculating the area

For calculating the area of a band we create a dummy geoboard and dummy band of the same shape as the current band. This allows us to change the dummy band during the area calculation without altering the actual band, and allows us to use various methods of the dummy geoboard and dummy band to aid the calculation. This is a messy way of doing it, however, since the dummy geoboard needs various properties added to it to prevent it throwing an error, which can be a confusing bug sometimes. It would also be good to abstract this out the area calculation so that it doesn't use the geoboard at all so that it can be used in other tools.

Once we've set up the band, we calculate the area recursively by ear-clipping:

If the shape is a triangle: 
	find the area using (a * b * sin(C))/2 formula.
else: 
	Find a pin such that the two adjacent pins form a triangle that lies entirely within the shape. We do this by taking each pin in turn and accepting it if the angle at that edge is < 180, the edge between the two adjacent pins does not cross any other edge, and the midpoint of that side is inside the shape. Recursively find the area of the triangle formed by this edge and the polygon remaining when this triangle is removed.


### Representing the state of the tool

The shape of each band can be represented by the coordinates of the pins that form it.