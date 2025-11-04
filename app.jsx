import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

const AdvancedDesignerWithAI = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const [objects, setObjects] = useState([]);
  const [selectedObject, setSelectedObject] = useState(null);
  const [selectedShape, setSelectedShape] = useState('cube');
  const [viewMode, setViewMode] = useState('perspective');
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [shareCode, setShareCode] = useState('');
  const [importCode, setImportCode] = useState('');
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // AI Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const chatEndRef = useRef(null);

  const shapes = [
    'cube', 'sphere', 'cylinder', 'cone', 'torus', 'pyramid', 
    'octahedron', 'dodecahedron', 'icosahedron', 'plane', 
    'ring', 'tube', 'tetrahedron'
  ];

  // Initialize Three.js
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      2000
    );
    camera.position.set(50, 50, 50);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-10, -10, -10);
    scene.add(directionalLight2);

    const gridHelper = new THREE.GridHelper(250, 250, 0x444444, 0x222222);
    gridHelper.userData.isGrid = true;
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(40);
    axesHelper.userData.isHelper = true;
    scene.add(axesHelper);

    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      const rotationSpeed = 0.005;
      const radius = Math.sqrt(camera.position.x ** 2 + camera.position.z ** 2);
      const angle = Math.atan2(camera.position.z, camera.position.x);
      const newAngle = angle - deltaX * rotationSpeed;
      
      camera.position.x = radius * Math.cos(newAngle);
      camera.position.z = radius * Math.sin(newAngle);
      camera.position.y += deltaY * rotationSpeed * 5;
      camera.lookAt(0, 0, 0);

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      const zoomSpeed = 0.1;
      const direction = e.deltaY > 0 ? 1 : -1;
      camera.position.multiplyScalar(1 + direction * zoomSpeed);
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Update grid visibility
  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.traverse((child) => {
      if (child.userData.isGrid || child.userData.isHelper) {
        child.visible = showGrid;
      }
    });
  }, [showGrid]);

  // Update scene
  useEffect(() => {
    if (!sceneRef.current) return;

    const toRemove = [];
    sceneRef.current.traverse((child) => {
      if (child.isMesh && child.userData.isDesignObject) {
        toRemove.push(child);
      }
    });
    toRemove.forEach(obj => sceneRef.current.remove(obj));

    objects.forEach((obj) => {
      const mesh = createMeshFromObject(obj);
      if (mesh) {
        if (obj.id === selectedObject) {
          const edges = new THREE.EdgesGeometry(mesh.geometry);
          const line = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 })
          );
          mesh.add(line);
        }
        sceneRef.current.add(mesh);
      }
    });
  }, [objects, selectedObject]);

  const createMeshFromObject = (obj) => {
    let geometry;

    switch (obj.type) {
      case 'cube':
        geometry = new THREE.BoxGeometry(obj.scale.x, obj.scale.y, obj.scale.z);
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(obj.scale.x / 2, 32, 32);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(obj.scale.x / 2, obj.scale.x / 2, obj.scale.y, 32);
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(obj.scale.x / 2, obj.scale.y, 32);
        break;
      case 'torus':
        geometry = new THREE.TorusGeometry(obj.scale.x / 2, obj.scale.x / 6, 16, 100);
        break;
      case 'pyramid':
        geometry = new THREE.ConeGeometry(obj.scale.x / 2, obj.scale.y, 4);
        break;
      case 'octahedron':
        geometry = new THREE.OctahedronGeometry(obj.scale.x / 2);
        break;
      case 'dodecahedron':
        geometry = new THREE.DodecahedronGeometry(obj.scale.x / 2);
        break;
      case 'icosahedron':
        geometry = new THREE.IcosahedronGeometry(obj.scale.x / 2);
        break;
      case 'plane':
        geometry = new THREE.PlaneGeometry(obj.scale.x, obj.scale.y);
        break;
      case 'ring':
        geometry = new THREE.RingGeometry(obj.scale.x / 4, obj.scale.x / 2, 32);
        break;
      case 'tube':
        const path = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, -obj.scale.y / 2, 0),
          new THREE.Vector3(0, obj.scale.y / 2, 0)
        ]);
        geometry = new THREE.TubeGeometry(path, 20, obj.scale.x / 4, 8, false);
        break;
      case 'tetrahedron':
        geometry = new THREE.TetrahedronGeometry(obj.scale.x / 2);
        break;
      default:
        geometry = new THREE.BoxGeometry(obj.scale.x, obj.scale.y, obj.scale.z);
    }

    const material = new THREE.MeshPhongMaterial({
      color: obj.color,
      transparent: obj.opacity < 1,
      opacity: obj.opacity,
      side: THREE.DoubleSide,
      shininess: 50,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
    mesh.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);
    mesh.userData.isDesignObject = true;
    mesh.userData.objectId = obj.id;

    return mesh;
  };

  // AI Chat function
  const sendMessageToAI = async () => {
    if (!userInput.trim() || isThinking) return;

    const userMessage = userInput.trim();
    setUserInput('');
    
    // Add user message to chat
    const newMessages = [...chatMessages, { role: 'user', content: userMessage }];
    setChatMessages(newMessages);
    setIsThinking(true);

    try {
      // Prepare the prompt for Claude
      const systemPrompt = `You are an AI assistant helping users create 3D designs. The user can describe what they want to create, and you will generate the necessary 3D objects.

Current scene state:
${JSON.stringify(objects.map(o => ({ name: o.name, type: o.type, position: o.position })), null, 2)}

Available shapes: cube, sphere, cylinder, cone, torus, pyramid, octahedron, dodecahedron, icosahedron, plane, ring, tube, tetrahedron

CRITICAL INSTRUCTIONS:
1. DO NOT OUTPUT ANYTHING OTHER THAN VALID JSON
2. Respond ONLY with a valid JSON object
3. NO markdown code blocks, NO backticks, NO explanatory text
4. Just pure JSON

Your response must be a JSON object with this EXACT structure:
{
  "objects": [
    {
      "type": "cube|sphere|cylinder|etc",
      "name": "descriptive-name",
      "position": {"x": 0, "y": 1, "z": 0},
      "rotation": {"x": 0, "y": 0, "z": 0},
      "scale": {"x": 1, "y": 1, "z": 1},
      "color": "#hexcolor",
      "opacity": 1
    }
  ],
  "message": "Brief description of what you created"
}

Rules:
- Position Y should typically be >= 0.5 (objects on the ground)
- Scale values are in meters (1 = 1 meter)
- Rotations are in radians
- Use appropriate spacing between objects
- Be creative but practical with designs
- If user asks to modify/delete existing objects, return empty objects array and explain in message

Examples:
User: "Create a red house"
Response: {"objects":[{"type":"cube","name":"house-base","position":{"x":0,"y":1,"z":0},"rotation":{"x":0,"y":0,"z":0},"scale":{"x":2,"y":2,"z":2},"color":"#ff0000","opacity":1},{"type":"pyramid","name":"roof","position":{"x":0,"y":2.5,"z":0},"rotation":{"x":0,"y":0,"z":0},"scale":{"x":2.2,"y":1,"z":2.2},"color":"#8B4513","opacity":1}],"message":"Created a red house with a brown roof!"}

User: "Add a blue sphere on the left"
Response: {"objects":[{"type":"sphere","name":"blue-sphere","position":{"x":-3,"y":1,"z":0},"rotation":{"x":0,"y":0,"z":0},"scale":{"x":1,"y":1,"z":1},"color":"#0000ff","opacity":1}],"message":"Added a blue sphere to the left!"}`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [
            {
              role: "user",
              content: systemPrompt + "\n\nUser request: " + userMessage
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      let responseText = data.content[0].text;
      
      // Clean up response - remove any markdown formatting
      responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      
      // Parse the JSON response
      const designData = JSON.parse(responseText);
      
      // Add the new objects to the scene
      if (designData.objects && designData.objects.length > 0) {
        const newObjects = designData.objects.map(obj => ({
          ...obj,
          id: Date.now() + Math.random()
        }));
        
        const updatedObjects = [...objects, ...newObjects];
        setObjects(updatedObjects);
        addToHistory(updatedObjects);
      }
      
      // Add AI response to chat
      const aiMessage = designData.message || "Objects created!";
      setChatMessages([...newMessages, { role: 'assistant', content: aiMessage }]);
      
    } catch (error) {
      console.error("Error communicating with AI:", error);
      setChatMessages([...newMessages, { 
        role: 'assistant', 
        content: "Sorry, I had trouble understanding that request. Try describing your design more simply, like 'create a red cube' or 'add a blue sphere'." 
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  const addObject = () => {
    const newObject = {
      id: Date.now(),
      type: selectedShape,
      name: `${selectedShape}-${objects.length + 1}`,
      position: { x: 0, y: 1, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
      opacity: 1,
    };
    
    const newObjects = [...objects, newObject];
    setObjects(newObjects);
    setSelectedObject(newObject.id);
    addToHistory(newObjects);
    showMessage(`${selectedShape} added!`);
  };

  const duplicateObject = (id) => {
    const obj = objects.find(o => o.id === id);
    if (!obj) return;

    const newObject = {
      ...obj,
      id: Date.now(),
      name: `${obj.name}-copy`,
      position: {
        x: obj.position.x + 1,
        y: obj.position.y,
        z: obj.position.z + 1
      }
    };

    const newObjects = [...objects, newObject];
    setObjects(newObjects);
    setSelectedObject(newObject.id);
    addToHistory(newObjects);
    showMessage('Object duplicated!');
  };

  const deleteObject = (id) => {
    const newObjects = objects.filter(obj => obj.id !== id);
    setObjects(newObjects);
    if (selectedObject === id) setSelectedObject(null);
    addToHistory(newObjects);
    showMessage('Object deleted!');
  };

  const updateObject = (id, updates) => {
    const newObjects = objects.map(obj =>
      obj.id === id ? { ...obj, ...updates } : obj
    );
    setObjects(newObjects);
  };

  const updateObjectImmediate = (id, updates) => {
    const newObjects = objects.map(obj =>
      obj.id === id ? { ...obj, ...updates } : obj
    );
    setObjects(newObjects);
    addToHistory(newObjects);
  };

  const setViewCamera = (view) => {
    if (!cameraRef.current) return;
    const camera = cameraRef.current;
    const distance = 60;

    switch (view) {
      case 'front':
        camera.position.set(0, 0, distance);
        break;
      case 'back':
        camera.position.set(0, 0, -distance);
        break;
      case 'left':
        camera.position.set(-distance, 0, 0);
        break;
      case 'right':
        camera.position.set(distance, 0, 0);
        break;
      case 'top':
        camera.position.set(0, distance, 0);
        break;
      case 'bottom':
        camera.position.set(0, -distance, 0);
        break;
      case 'perspective':
        camera.position.set(50, 50, 50);
        break;
    }
    camera.lookAt(0, 0, 0);
    setViewMode(view);
  };

  const addToHistory = (newObjects) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newObjects)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setObjects(JSON.parse(JSON.stringify(history[historyIndex - 1])));
      showMessage('Undo');
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setObjects(JSON.parse(JSON.stringify(history[historyIndex + 1])));
      showMessage('Redo');
    }
  };

  const clearAll = () => {
    setObjects([]);
    addToHistory([]);
    showMessage('All objects cleared!');
  };

  const exportSTL = () => {
    if (objects.length === 0) {
      showMessage('Add objects first!');
      return;
    }

    let stlString = 'solid design\n';

    objects.forEach(obj => {
      const mesh = createMeshFromObject(obj);
      if (!mesh) return;

      const geometry = mesh.geometry;
      const position = geometry.attributes.position;
      const matrix = new THREE.Matrix4();
      matrix.makeRotationFromEuler(new THREE.Euler(obj.rotation.x, obj.rotation.y, obj.rotation.z));
      matrix.setPosition(obj.position.x, obj.position.y, obj.position.z);

      if (geometry.index) {
        for (let i = 0; i < geometry.index.count; i += 3) {
          const vertices = [];
          for (let j = 0; j < 3; j++) {
            const idx = geometry.index.array[i + j];
            const v = new THREE.Vector3(
              position.array[idx * 3],
              position.array[idx * 3 + 1],
              position.array[idx * 3 + 2]
            ).applyMatrix4(matrix);
            vertices.push(v);
          }

          const normal = new THREE.Vector3()
            .crossVectors(
              new THREE.Vector3().subVectors(vertices[1], vertices[0]),
              new THREE.Vector3().subVectors(vertices[2], vertices[0])
            )
            .normalize();

          stlString += `  facet normal ${normal.x} ${normal.y} ${normal.z}\n`;
          stlString += `    outer loop\n`;
          vertices.forEach(v => {
            stlString += `      vertex ${v.x} ${v.y} ${v.z}\n`;
          });
          stlString += `    endloop\n`;
          stlString += `  endfacet\n`;
        }
      }
    });

    stlString += 'endsolid design\n';

    const blob = new Blob([stlString], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `design-${Date.now()}.stl`;
    link.click();
    URL.revokeObjectURL(url);
    showMessage('STL exported!');
  };

  const generateShareCode = () => {
    const designData = JSON.stringify(objects);
    const encoded = btoa(designData);
    setShareCode(encoded);
    showMessage('Share code generated!');
  };

  const importDesign = () => {
    try {
      const decoded = atob(importCode);
      const designData = JSON.parse(decoded);
      setObjects(designData);
      addToHistory(designData);
      setImportCode('');
      showMessage('Design imported!');
    } catch (error) {
      showMessage('Invalid share code!');
    }
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const selectedObj = objects.find(o => o.id === selectedObject);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Left Sidebar - AI Chat */}
      <div className="w-80 bg-gray-800 flex flex-col border-r border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-blue-400">🤖 AI 3D Designer</h1>
          <p className="text-xs text-gray-400 mt-1">Describe what you want to create!</p>
        </div>
        
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatMessages.length === 0 && (
            <div className="text-sm text-gray-400 space-y-2">
              <p className="font-semibold text-blue-400">Try saying:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>"Create a red house with a roof"</li>
                <li>"Add a blue sphere next to it"</li>
                <li>"Make a rocket ship"</li>
                <li>"Build a snowman"</li>
                <li>"Create a solar system"</li>
                <li>"Design a castle"</li>
              </ul>
            </div>
          )}
          
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-600 ml-8'
                  : 'bg-gray-700 mr-8'
              }`}
            >
              <div className="text-xs text-gray-300 mb-1">
                {msg.role === 'user' ? 'You' : '🤖 AI Designer'}
              </div>
              <div className="text-sm">{msg.content}</div>
            </div>
          ))}
          
          {isThinking && (
            <div className="bg-gray-700 p-3 rounded-lg mr-8">
              <div className="text-xs text-gray-300 mb-1">🤖 AI Designer</div>
              <div className="text-sm text-gray-400">Thinking...</div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>
        
        {/* Chat Input */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessageToAI()}
              placeholder="Describe what to create..."
              disabled={isThinking}
              className="flex-1 p-2 bg-gray-700 rounded text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={sendMessageToAI}
              disabled={isThinking || !userInput.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm font-medium"
            >
              Send
            </button>
          </div>
        </div>

        {/* Manual Controls */}
        <div className="p-4 border-t border-gray-700 bg-gray-850">
          <h2 className="text-sm font-semibold mb-2 text-gray-300">Manual Controls</h2>
          <select
            value={selectedShape}
            onChange={(e) => setSelectedShape(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-xs mb-2"
          >
            {shapes.map(shape => (
              <option key={shape} value={shape}>
                {shape.charAt(0).toUpperCase() + shape.slice(1)}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button onClick={addObject} className="bg-blue-600 hover:bg-blue-700 p-2 rounded text-xs">
              Add Shape
            </button>
            <button onClick={clearAll} className="bg-red-600 hover:bg-red-700 p-2 rounded text-xs">
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="bg-gray-700 hover:bg-gray-600 p-2 rounded disabled:opacity-50"
            >
              ↶ Undo
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="bg-gray-700 hover:bg-gray-600 p-2 rounded disabled:opacity-50"
            >
              ↷ Redo
            </button>
          </div>
        </div>
      </div>

      {/* Center - 3D Viewport */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-gray-800 p-2 border-b border-gray-700 flex gap-2 items-center flex-wrap">
          <span className="text-xs text-gray-400">View:</span>
          {['perspective', 'front', 'back', 'left', 'right', 'top'].map(view => (
            <button
              key={view}
              onClick={() => setViewCamera(view)}
              className={`px-3 py-1 rounded text-xs ${
                viewMode === view ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {view}
            </button>
          ))}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className="px-3 py-1 rounded text-xs bg-gray-700 hover:bg-gray-600 ml-auto"
          >
            Grid: {showGrid ? 'On' : 'Off'}
          </button>
        </div>

        {/* Viewport */}
        <div className="flex-1 relative">
          <div ref={mountRef} className="w-full h-full" />
          
          {message && (
            <div className="absolute top-4 right-4 bg-blue-600 px-4 py-2 rounded shadow-lg text-sm">
              {message}
            </div>
          )}

          <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 p-2 rounded text-xs space-y-1">
            <div>Objects: {objects.length}</div>
            <div>View: {viewMode}</div>
            <div className="text-gray-400">Drag: Rotate | Scroll: Zoom</div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Objects & Properties */}
      <div className="w-80 bg-gray-800 overflow-y-auto border-l border-gray-700">
        <div className="p-4">
          {/* Objects List */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold mb-2 text-gray-300">Scene Objects ({objects.length})</h2>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {objects.map((obj) => (
                <div
                  key={obj.id}
                  onClick={() => setSelectedObject(obj.id)}
                  className={`p-2 rounded cursor-pointer text-sm ${
                    selectedObject === obj.id ? 'bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="truncate">{obj.name}</span>
                    <div className="space-x-1 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); duplicateObject(obj.id); }}
                        className="text-blue-400 hover:text-blue-300 text-xs"
                      >
                        Copy
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteObject(obj.id); }}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Del
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Properties Panel */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold mb-2 text-gray-300">Properties</h2>
            
            {selectedObj ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400">Name</label>
                  <input
                    type="text"
                    value={selectedObj.name}
                    onChange={(e) => updateObject(selectedObj.id, { name: e.target.value })}
                    className="w-full p-1 bg-gray-700 rounded text-xs mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400">Position</label>
                  <div className="grid grid-cols-3 gap-1 mt-1">
                    {['x', 'y', 'z'].map(axis => (
                      <div key={axis}>
                        <label className="text-xs text-gray-500">{axis.toUpperCase()}</label>
                        <input
                          type="number"
                          step="0.1"
                          value={selectedObj.position[axis].toFixed(2)}
                          onChange={(e) => updateObject(selectedObj.id, {
                            position: { ...selectedObj.position, [axis]: parseFloat(e.target.value) || 0 }
                          })}
                          onBlur={() => updateObjectImmediate(selectedObj.id, selectedObj)}
                          className="w-full p-1 bg-gray-700 rounded text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400">Scale</label>
                  <div className="grid grid-cols-3 gap-1 mt-1">
                    {['x', 'y', 'z'].map(axis => (
                      <div key={axis}>
                        <label className="text-xs text-gray-500">{axis.toUpperCase()}</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={selectedObj.scale[axis].toFixed(2)}
                          onChange={(e) => updateObject(selectedObj.id, {
                            scale: { ...selectedObj.scale, [axis]: Math.max(0.1, parseFloat(e.target.value) || 0.1) }
                          })}
                          onBlur={() => updateObjectImmediate(selectedObj.id, selectedObj)}
                          className="w-full p-1 bg-gray-700 rounded text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400">Color</label>
                  <input
                    type="color"
                    value={selectedObj.color}
                    onChange={(e) => updateObjectImmediate(selectedObj.id, { color: e.target.value })}
                    className="w-full h-8 rounded mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400">Opacity</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={selectedObj.opacity}
                    onChange={(e) => updateObject(selectedObj.id, { opacity: parseFloat(e.target.value) })}
                    onMouseUp={() => updateObjectImmediate(selectedObj.id, selectedObj)}
                    className="w-full mt-1"
                  />
                  <div className="text-xs text-gray-500 mt-1">{(selectedObj.opacity * 100).toFixed(0)}%</div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400 text-center py-4">
                Select an object to edit
              </div>
            )}
          </div>

          {/* Export Section */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-300">Export & Share</h2>
            <button onClick={exportSTL} className="w-full bg-green-600 hover:bg-green-700 p-2 rounded text-xs">
              Download STL
            </button>
            <button onClick={generateShareCode} className="w-full bg-purple-600 hover:bg-purple-700 p-2 rounded text-xs">
              Generate Share Code
            </button>
            {shareCode && (
              <textarea
                value={shareCode}
                readOnly
                onClick={(e) => e.target.select()}
                className="w-full p-2 bg-gray-700 rounded text-xs h-16"
              />
            )}
            <textarea
              value={importCode}
              onChange={(e) => setImportCode(e.target.value)}
              placeholder="Paste share code..."
              className="w-full p-2 bg-gray-700 rounded text-xs h-16"
            />
            <button onClick={importDesign} className="w-full bg-indigo-600 hover:bg-indigo-700 p-2 rounded text-xs">
              Import Design
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedDesignerWithAI;

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AdvancedDesignerWithAI />);