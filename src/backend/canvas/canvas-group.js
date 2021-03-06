/*

 Copyright (C) 2017 Jayesh Salvi, Blue Math Software Inc.

 This file is part of Zector Canvas.

 Zector Canvas is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 Zector Canvas is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with Zector Canvas.  If not, see <http://www.gnu.org/licenses/>.

 */


import RenderGroup from '../rgroup'
import {vec2, AABB, Transform} from 'zmath'
import zdom from 'zdom'

const IDENTITY = Transform.identity();

class CanvasGroup extends RenderGroup {

  /**
   * @param {Transform} transform
   */
  constructor(transform) {
    super(transform);
    
  }
  
  _updateLocalCanvasParameters() {

    if(this.children.length > 0) {
      this.aabb = new AABB({});
      for(let child of this.children) {
        this.aabb.merge(child.aabb);
      }
    } else {
      this.aabb = new AABB({
        min:[0,0], max:[this.backend.width,this.backend.height]
      });
    }
    this.canvasWidth = this.aabb.width();
    this.canvasHeight = this.aabb.height();
    this.canvasOffset = this.aabb.min;
  }

  /**
   * Append child to the list of children
   * @param {Item} child - Can be RenderShape or RenderGroup
   */
  add(child) {
    super.add(child);
    // this._updateLocalCanvasParameters();
  }

  _initCanvas(size) {
    this._canvas = zdom.createCanvas();
    if(size) {
      this._canvas.width = this.canvasWidth = size[0];
      this._canvas.height = this.canvasHeight = size[1];
      this.canvasOffset = [0,0];
    } else {
      this._updateLocalCanvasParameters();
      this._canvas.width = this.canvasWidth;
      this._canvas.height = this.canvasHeight;
    }
    this._ctx = this._canvas.getContext('2d');
  }

  _applyTransform() {
    if(!this.transform.isIdentity()) {
      this._ctx.transform(...this.transform.toArray());
    }
  }

  _clearCanvas() {
    this._ctx.save();
    this._ctx.setTransform(...IDENTITY.toArray());
    this._ctx.clearRect(0,0,this.canvasWidth, this.canvasHeight);
    this._ctx.restore();
  }

  _pushContext() {
    this._ctx.save();
    this._applyTransform();
  }

  _popContext() {
    this._ctx.restore();
  }

  render() {
    if(!this._canvas) {
      this._initCanvas();
    }

    if(this._isDirty()) {
      this._clearCanvas();

      super.render();

      this._pushContext();
      for(let child of this.children) {
        if(child.isVisible()) {
          this._ctx.save();
          
          let offset = vec2.sub(child.canvasOffset, this.canvasOffset);
          
          let transform = new Transform().translate(offset).mul(child.transform);
          
          this._ctx.transform(...transform.toArray());
          
          if(this.backend._debugLocalCanvas) {
            this._ctx.fillStyle = '#ddd';
            this._ctx.fillRect(0,0,child.canvasWidth, child.canvasHeight);
          }
          
          this._ctx.drawImage(child._canvas,0,0);
          
          this._ctx.restore();
        }
      }
      this._popContext();
    }
  }
}

export default CanvasGroup;